'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { generateDietarySuggestions, GenerateDietarySuggestionsInput } from '@/ai/flows/generate-dietary-suggestions';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/providers/auth-provider';
import { HealthData, healthDataSchema as baseSchema } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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

export default function DietPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string | null>(null);
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
      setSuggestions(result.dietarySuggestions);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      setSuggestions('Sorry, we couldn\'t generate suggestions at this time. Please try again later.');
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Diet Suggestions</h1>
        <p className="text-muted-foreground">Get personalized diet plans based on your health metrics.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
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

        <Card>
          <CardHeader>
            <CardTitle>Your Personalized Suggestions</CardTitle>
            <CardDescription>
              Here are the dietary recommendations from our AI assistant.
            </CardDescription>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            {loading && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            )}
            {suggestions && <div dangerouslySetInnerHTML={{ __html: suggestions.replace(/\n/g, '<br />') }} />}
            {!loading && !suggestions && <p>Your suggestions will appear here.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
