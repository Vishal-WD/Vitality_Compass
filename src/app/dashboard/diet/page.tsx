'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { generateDietarySuggestions, GenerateDietarySuggestionsInput, GenerateDietarySuggestionsOutput } from '@/ai/flows/generate-dietary-suggestions';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/providers/auth-provider';
import { HealthData, healthDataSchema as baseSchema } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Apple, Carrot, Fish, Shell, Heart, Droplets, Thermometer, Percent, ShieldCheck, ShieldAlert, TrendingDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

const formSchema = baseSchema.pick({
    height: true,
    weight: true,
    age: true,
    bloodPressure: true,
    cholesterol: true,
    sugarLevels: true,
    fats: true,
    bloodPoints: true,
});

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

type SuggestionCategory = 'fruits' | 'vegetables' | 'proteins' | 'seedsAndNuts';

export default function DietPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GenerateDietarySuggestionsOutput | null>(null);
  const [isFetchingData, setIsFetchingData] = useState(true);

  const form = useForm<GenerateDietarySuggestionsInput>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (user) {
      const fetchLatestData = async () => {
        setIsFetchingData(true);
        const q = query(
          collection(db, 'healthData'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const latestData = querySnapshot.docs[0].data() as HealthData;
          form.reset(latestData);
        }
        setIsFetchingData(false);
      };
      fetchLatestData();
    }
  }, [user, form]);

  async function onSubmit(values: GenerateDietarySuggestionsInput) {
    setLoading(true);
    setSuggestions(null);
    try {
      const result = await generateDietarySuggestions(values);
      setSuggestions(result);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Diet Suggestions</h1>
        <p className="text-muted-foreground">Get personalized diet plans based on your health metrics.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 lg:sticky top-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Health Metrics</CardTitle>
              <CardDescription>
                We've pre-filled your latest data. Adjust if needed and generate suggestions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isFetchingData ? (
                  <div className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                  </div>
              ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                   <ScrollArea className="h-96 pr-6">
                      <div className="space-y-4 py-4">
                          <FormField control={form.control} name="height" render={({ field }) => (<FormItem><FormLabel>Height (cm)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name="weight" render={({ field }) => (<FormItem><FormLabel>Weight (kg)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name="age" render={({ field }) => (<FormItem><FormLabel>Age</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name="bloodPressure" render={({ field }) => (<FormItem><FormLabel>Blood Pressure</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name="cholesterol" render={({ field }) => (<FormItem><FormLabel>Cholesterol</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name="sugarLevels" render={({ field }) => (<FormItem><FormLabel>Sugar Levels</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name="fats" render={({ field }) => (<FormItem><FormLabel>Fats (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name="bloodPoints" render={({ field }) => (<FormItem><FormLabel>Blood Points</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                  </ScrollArea>
                  <Button type="submit" className="w-full mt-4" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? 'Generating...' : 'Generate Suggestions'}
                  </Button>
                </form>
              </Form>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Your Personalized Suggestions</CardTitle>
                    <CardDescription>
                    Here are the dietary recommendations from our AI assistant.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading && (
                    <div className="grid md:grid-cols-2 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                                <Skeleton className="h-16 w-16 rounded-md" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                    )}
                    {suggestions ? (
                        <div className="space-y-6">
                            <div className="space-y-4 rounded-lg border p-4">
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
                                return (
                                <div key={category}>
                                    <div className="flex items-center gap-3 mb-4">
                                        {categoryIcons[category]}
                                        <h3 className="text-xl font-semibold capitalize">{category.replace(/([A-Z])/g, ' $1')}</h3>
                                    </div>
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {suggestions[category]?.map((item, index) => (
                                        <Card key={index}>
                                            <CardContent className="p-0">
                                                <Image
                                                    src={`https://placehold.co/400x300.png`}
                                                    data-ai-hint={item.imageHint}
                                                    alt={item.name}
                                                    width={400}
                                                    height={300}
                                                    className="rounded-t-lg object-cover aspect-[4/3]"
                                                />
                                                <div className="p-4">
                                                    <p className="font-semibold">{item.name}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">{item.reason}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    </div>
                                </div>
                            )})}
                        </div>
                    ) : (
                    !loading && <p className="text-center text-muted-foreground py-10">Your suggestions will appear here.</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
