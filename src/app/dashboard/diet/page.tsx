
'use client';

import { useState, useEffect, ReactNode } from 'react';
import { generateDietarySuggestions, GenerateDietarySuggestionsOutput, SuggestionItem } from '@/ai/flows/generate-dietary-suggestions';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/providers/auth-provider';
import { HealthData } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Droplets, Thermometer, Percent, ShieldCheck, ShieldAlert, TrendingDown, Info, Apple, Carrot, Beef, Leaf, Ban } from 'lucide-react';

const DietSuggestionCard = ({ item }: { item: SuggestionItem }) => {
    return (
        <Card className="flex flex-col border-2 border-primary/10 bg-primary/5 hover:shadow-md transition-shadow duration-300">
            <CardContent className="flex-1 p-4">
                <p className="font-semibold text-base text-primary/90">{item.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.reason}</p>
            </CardContent>
        </Card>
    );
};

export default function DietPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<GenerateDietarySuggestionsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const fetchAndGenerate = async () => {
        setLoading(true);
        setError(null);
        setSuggestions(null);

        try {
          // 1. Fetch the latest health data to get its ID
          const healthDataQuery = query(
            collection(db, 'healthData'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          const healthDataSnapshot = await getDocs(healthDataQuery);

          if (healthDataSnapshot.empty) {
            setError("No health data found. Please add your data on the dashboard page first.");
            setLoading(false);
            return;
          }
          
          const latestHealthDoc = healthDataSnapshot.docs[0];
          const latestHealthData = { id: latestHealthDoc.id, ...latestHealthDoc.data() } as HealthData;

          // 2. Check for a cached suggestion
          const suggestionRef = doc(db, 'generatedSuggestions', `${user.uid}_${latestHealthData.id}_diet`);
          const suggestionSnap = await getDoc(suggestionRef);

          let finalSuggestions: GenerateDietarySuggestionsOutput;

          if (suggestionSnap.exists()) {
            // Use cached data
            finalSuggestions = suggestionSnap.data().suggestionData;
          } else {
            // Generate new suggestions and cache them
            const { id, userId, createdAt, ...plainData } = latestHealthData;

            const generatedResult = await generateDietarySuggestions(plainData);
            
            await setDoc(suggestionRef, {
              userId: user.uid,
              healthDataId: latestHealthData.id,
              type: 'diet',
              suggestionData: generatedResult,
              createdAt: serverTimestamp(),
            });

            finalSuggestions = generatedResult;
          }
          
          setSuggestions(finalSuggestions);

        } catch (err) {
          console.error('Failed to get suggestions:', err);
          setError("An error occurred while generating your diet plan. Please try again later.");
        }
        setLoading(false);
      };
      fetchAndGenerate();
    } else {
        setLoading(false);
    }
  }, [user]);

  const metricAnalysisIcons: Record<string, ReactNode> = {
      "Blood Pressure": <Heart className="h-6 w-6 text-red-500" />,
      "Cholesterol": <Droplets className="h-6 w-6 text-yellow-500" />,
      "Sugar Levels": <Thermometer className="h-6 w-6 text-blue-500" />,
      "Fats": <Percent className="h-6 w-6 text-purple-500" />,
  }

  const statusIcons: Record<string, ReactNode> = {
      "High": <ShieldAlert className="h-5 w-5 text-red-500" />,
      "Low": <TrendingDown className="h-5 w-5 text-blue-500" />,
      "Normal": <ShieldCheck className="h-5 w-5 text-green-500" />,
  }

  const categoryIcons: Record<string, ReactNode> = {
    fruits: <Apple className="h-6 w-6 text-primary" />,
    vegetables: <Carrot className="h-6 w-6 text-primary" />,
    proteins: <Beef className="h-6 w-6 text-primary" />,
    seedsAndNuts: <Leaf className="h-6 w-6 text-primary" />,
    foodsToLimit: <Ban className="h-6 w-6 text-destructive" />,
  };
  
  const suggestionCategories = ['fruits', 'vegetables', 'proteins', 'seedsAndNuts', 'foodsToLimit'];


  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-6">
            <div className="space-y-4 rounded-lg border p-4 md:p-6">
                <Skeleton className="h-8 w-1/3 mb-4" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-2/3" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="flex flex-col gap-4 p-4 rounded-lg border">
                        <Skeleton className="h-6 w-1/2" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
      );
    }
    
    if (error) {
       return (
         <Card className="text-center py-12 px-4">
            <Info className="mx-auto h-12 w-12 text-destructive" />
            <h3 className="text-xl font-semibold mt-4">Unable to Generate Suggestions</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">{error}</p>
            <Button asChild className="mt-6">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </Card>
       )
    }

    if (suggestions) {
      return (
        <div className="space-y-8" id="suggestions-content">
            <div className="space-y-4 rounded-xl border p-4 sm:p-6 bg-card shadow-sm">
               <h3 className="font-bold text-xl sm:text-2xl text-primary/90">Analysis Summary</h3>
               <ul className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                   {suggestions.analysis?.map(item => (
                       <li key={item.metric} className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-full mt-1">
                               {metricAnalysisIcons[item.metric]}
                            </div>
                           <div className="flex-1">
                               <span className="font-semibold text-base sm:text-lg">{item.metric}: <span className="font-bold">{item.status}</span></span>
                               <p className="text-sm text-muted-foreground">{item.comment}</p>
                           </div>
                           {statusIcons[item.status]}
                       </li>
                   ))}
               </ul>
               <p className="text-sm text-muted-foreground pt-4 leading-relaxed">{suggestions.summary}</p>
            </div>
            
            {suggestionCategories.map(category => {
                const items = suggestions[category as keyof GenerateDietarySuggestionsOutput] as SuggestionItem[] | undefined;

                if (!items || items.length === 0) return null;
                const title = category.replace(/([A-Z])/g, ' $1');


                return (
                <div key={category}>
                    <div className="flex items-center gap-3 mb-4">
                        {categoryIcons[category]}
                        <h3 className="text-xl sm:text-2xl font-bold capitalize text-primary/90">{title}</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item, index) => (
                        <DietSuggestionCard key={`${category}-${index}`} item={item} />
                    ))}
                    </div>
                </div>
            )})}
        </div>
      );
    }
    
    return <p className="text-center text-muted-foreground py-10">Your suggestions will appear here.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Diet Suggestions</h1>
        <p className="text-muted-foreground">Personalized diet plans automatically generated from your latest health data.</p>
      </div>

       <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Your Personalized Suggestions</CardTitle>
                    <CardDescription>
                    Here are the dietary recommendations from our AI assistant, based on your latest metrics.
                    </CardDescription>
                  </div>
                </div>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    </div>
  );
}
