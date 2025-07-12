'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { generateWorkoutSuggestions, WorkoutSuggestionsInput, WorkoutSuggestionsOutput } from '@/ai/flows/generate-workout-suggestions';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/providers/auth-provider';
import { HealthData } from '@/lib/types';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, ShieldCheck, ShieldAlert, TrendingDown, HeartPulse } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const formSchema = z.object({
  age: z.coerce.number().positive(),
  weight: z.coerce.number().positive(),
  bmi: z.coerce.number().positive(),
});

const statusIcons: Record<string, ReactNode> = {
    "Overweight": <ShieldAlert className="h-5 w-5 text-red-500" />,
    "Obese": <ShieldAlert className="h-5 w-5 text-red-500" />,
    "Underweight": <TrendingDown className="h-5 w-5 text-blue-500" />,
    "Healthy": <ShieldCheck className="h-5 w-5 text-green-500" />,
}

export default function WorkoutPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<WorkoutSuggestionsOutput | null>(null);
  const [isFetchingData, setIsFetchingData] = useState(true);

  const form = useForm<WorkoutSuggestionsInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      age: 0,
      weight: 0,
      bmi: 0
    }
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
    } else {
        setIsFetchingData(false);
    }
  }, [user, form]);

  async function onSubmit(values: WorkoutSuggestionsInput) {
    setLoading(true);
    setSuggestions(null);
    try {
      const result = await generateWorkoutSuggestions(values);
      setSuggestions(result);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Workout Plans</h1>
        <p className="text-muted-foreground">Get weekly workout plans tailored to your age, weight, and BMI.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 lg:sticky top-6">
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
        </div>

        <div className="lg:col-span-2">
          <Card className="min-h-full">
            <CardHeader>
              <CardTitle>Your Personalized Workout</CardTitle>
              <CardDescription>
                Here is the 7-day workout plan from our AI personal trainer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              )}
              
              {suggestions ? (
                <div className="space-y-6">
                   {suggestions.analysis && (
                     <div className="space-y-4 rounded-lg border p-4">
                         <h3 className="font-semibold text-lg">Analysis Summary</h3>
                         <div className="flex items-start gap-3">
                            <div className="flex items-center gap-2 pt-1">
                                <HeartPulse className="h-5 w-5 text-muted-foreground" />
                                {statusIcons[suggestions.analysis.bmiStatus]}
                            </div>
                            <div>
                                <span className="font-semibold">BMI Status: {suggestions.analysis.bmiStatus}</span>
                                <p className="text-sm text-muted-foreground">{suggestions.analysis.comment}</p>
                            </div>
                        </div>
                     </div>
                   )}

                  {suggestions.weeklyPlan && (
                    <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                      {suggestions.weeklyPlan.map((dayPlan, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                          <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                            <div className="flex flex-col text-left">
                              <span>{dayPlan.day}</span>
                              <span className="text-sm font-normal text-primary">{dayPlan.title}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2">
                            <p className="text-muted-foreground mb-4">{dayPlan.description}</p>
                            {dayPlan.exercises.length > 0 ? (
                              <div className="space-y-4">
                                  {dayPlan.exercises.map((exercise, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 rounded-lg border">
                                      <Image 
                                        src={`https://placehold.co/100x100.png`}
                                        data-ai-hint={exercise.imageHint}
                                        alt={exercise.name}
                                        width={80}
                                        height={80}
                                        className="rounded-md object-cover aspect-square"
                                      />
                                      <div className="flex-1">
                                        <p className="font-semibold">{exercise.name}</p>
                                        <p className="text-sm text-muted-foreground">{exercise.sets} &bull; {exercise.reps}</p>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <p className="text-center text-muted-foreground py-4">This is a rest day. Enjoy!</p>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </div>
              ) : (
                 !loading && <p className="text-center text-muted-foreground pt-10">Your workout plan will appear here.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
