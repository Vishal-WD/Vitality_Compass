
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
import { Apple, Carrot, Fish, Shell, Heart, Droplets, Thermometer, Percent, ShieldCheck, ShieldAlert, TrendingDown, Info } from 'lucide-react';

type SuggestionCategory = 'fruits' | 'vegetables' | 'proteins' | 'seedsAndNuts';

const DietSuggestionCard = ({ item }: { item: SuggestionItem }) => {
    return (
        <Card className="flex flex-col">
            <CardContent className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="text-6xl mb-4">{item.emoji}</div>
                <p className="font-semibold text-lg">{item.name}</p>
                <p className="text-sm text-muted-foreground mt-2">{item.reason}</p>
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
            const { createdAt, userId, id, ...plainData } = latestHealthData;
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

  const categoryIcons: Record<string, ReactNode> = {
    fruits: <Apple className="w-6 h-6 text-primary" />,
    vegetables: <Carrot className="w-6 h-6 text-primary" />,
    proteins: <Fish className="w-6 h-6 text-primary" />,
    seedsAndNuts: <Shell className="w-6 h-6 text-primary" />,
  };

  const metricAnalysisIcons: Record<string, ReactNode> = {
      "Blood Pressure": <Heart className="h-5 w-5 text-muted-foreground" />,
      "Cholesterol": <Droplets className="h-5 w-5 text-muted-foreground" />,
      "Sugar Levels": <Thermometer className="h-5 w-5 text-muted-foreground" />,
      "Fats": <Percent className="h-5 w-5 text-muted-foreground" />,
  }

  const statusIcons: Record<string, ReactNode> = {
      "High": <ShieldAlert className="h-5 w-5 text-red-500" />,
      "Low": <TrendingDown className="h-5 w-5 text-blue-500" />,
      "Normal": <ShieldCheck className="h-5 w-5 text-green-500" />,
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-6">
            <div className="space-y-4 rounded-lg border p-4">
                <Skeleton className="h-6 w-1/3 mb-4" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-2/3" />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="flex flex-col gap-4 p-4 rounded-lg border">
                        <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                        <div className="space-y-2 flex-1 text-center">
                            <Skeleton className="h-5 w-3/4 mx-auto" />
                            <Skeleton className="h-4 w-full mx-auto" />
                            <Skeleton className="h-4 w-5/6 mx-auto" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
      );
    }
    
    if (error) {
       return (
         <Card className="text-center py-12">
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
        <div className="space-y-6">
            <div className="space-y-4 rounded-lg border p-4 bg-card">
               <h3 className="font-semibold text-lg">Analysis Summary</h3>
               <ul className="space-y-3">
                   {suggestions.analysis?.map(item => (
                       <li key={item.metric} className="flex items-start gap-3">
                            <div className="flex items-center gap-2 pt-1">
                               {metricAnalysisIcons[item.metric]}
                               {statusIcons[item.status]}
                            </div>
                           <div>
                               <span className="font-semibold">{item.metric}: {item.status}</span>
                               <p className="text-sm text-muted-foreground">{item.comment}</p>
                           </div>
                       </li>
                   ))}
               </ul>
               <p className="text-sm text-muted-foreground pt-2">{suggestions.summary}</p>
            </div>
            
            {Object.keys(categoryIcons).map(key => {
                const category = key as SuggestionCategory;
                const items = suggestions[category];

                if (!items || items.length === 0) return null;

                return (
                <div key={category}>
                    <div className="flex items-center gap-3 mb-4">
                        {categoryIcons[category]}
                        <h3 className="text-xl font-semibold capitalize">{category.replace(/([A-Z])/g, ' $1')}</h3>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <div>
                  <CardTitle>Your Personalized Suggestions</CardTitle>
                  <CardDescription>
                  Here are the dietary recommendations from our AI assistant, based on your latest metrics.
                  </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    </div>
  );
}
