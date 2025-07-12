'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { generateWorkoutSuggestions, WorkoutSuggestionsInput } from '@/ai/flows/generate-workout-suggestions';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/providers/auth-provider';
import { HealthData } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  age: z.coerce.number().positive(),
  weight: z.coerce.number().positive(),
  bmi: z.coerce.number().positive(),
});

export default function WorkoutPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [isFetchingData, setIsFetchingData] = useState(true);

  const form = useForm<WorkoutSuggestionsInput>({
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
          form.reset({
            age: latestData.age,
            weight: latestData.weight,
            bmi: latestData.bmi,
          });
        }
        setIsFetchingData(false);
      };
      fetchLatestData();
    }
  }, [user, form]);

  async function onSubmit(values: WorkoutSuggestionsInput) {
    setLoading(true);
    setSuggestions(null);
    try {
      const result = await generateWorkoutSuggestions(values);
      setSuggestions(result.suggestions);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      setSuggestions('Sorry, we couldn\'t generate suggestions at this time. Please try again later.');
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Workout Plans</h1>
        <p className="text-muted-foreground">Get workout plans tailored to your age, weight, and BMI.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Metrics</CardTitle>
            <CardDescription>
              We've pre-filled your latest data. Adjust if needed.
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="age" render={({ field }) => (<FormItem><FormLabel>Age</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="weight" render={({ field }) => (<FormItem><FormLabel>Weight (kg)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="bmi" render={({ field }) => (<FormItem><FormLabel>BMI</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? 'Generating...' : 'Generate Workout Plan'}
                </Button>
              </form>
            </Form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Personalized Workout</CardTitle>
            <CardDescription>
              Here is the workout plan from our AI personal trainer.
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
             {!loading && !suggestions && <p>Your workout plan will appear here.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
