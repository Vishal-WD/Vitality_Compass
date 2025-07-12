
'use client';

import { useState, useEffect, ReactNode } from 'react';
import { generateWorkoutSuggestions, WorkoutSuggestionsOutput, Exercise } from '@/ai/flows/generate-workout-suggestions';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/providers/auth-provider';
import { HealthData } from '@/lib/types';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, ShieldAlert, TrendingDown, HeartPulse, Heart, Droplets, Thermometer, Percent, Info } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const metricAnalysisIcons: Record<string, ReactNode> = {
    "BMI": <HeartPulse className="h-5 w-5 text-muted-foreground" />,
    "Blood Pressure": <Heart className="h-5 w-5 text-muted-foreground" />,
    "Cholesterol": <Droplets className="h-5 w-5 text-muted-foreground" />,
    "Sugar Levels": <Thermometer className="h-5 w-5 text-muted-foreground" />,
    "Fats": <Percent className="h-5 w-5 text-muted-foreground" />,
}

const statusIcons: Record<string, ReactNode> = {
    "High": <ShieldAlert className="h-5 w-5 text-red-500" />,
    "Overweight": <ShieldAlert className="h-5 w-5 text-red-500" />,
    "Obese": <ShieldAlert className="h-5 w-5 text-red-500" />,
    "Low": <TrendingDown className="h-5 w-5 text-blue-500" />,
    "Underweight": <TrendingDown className="h-5 w-5 text-blue-500" />,
    "Normal": <ShieldCheck className="h-5 w-5 text-green-500" />,
    "Healthy": <ShieldCheck className="h-5 w-5 text-green-500" />,
}

const WorkoutExerciseCard = ({ exercise }: { exercise: Exercise }) => {
    return (
        <div className="flex items-center gap-4 p-3 rounded-lg border">
            <div className="flex-1">
                <p className="font-semibold">{exercise.name}</p>
                <p className="text-sm text-muted-foreground">{exercise.sets} &bull; {exercise.reps}</p>
            </div>
        </div>
    );
};


export default function WorkoutPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<WorkoutSuggestionsOutput | null>(null);
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
          const suggestionRef = doc(db, 'generatedSuggestions', `${user.uid}_${latestHealthData.id}_workout`);
          const suggestionSnap = await getDoc(suggestionRef);

          if (suggestionSnap.exists()) {
            // Use cached data
            setSuggestions(suggestionSnap.data().suggestionData);
          } else {
            // Generate new suggestions and cache them
            const { createdAt, userId, id, ...plainData } = latestHealthData;
            const generatedResult = await generateWorkoutSuggestions(plainData);
            
            await setDoc(suggestionRef, {
              userId: user.uid,
              healthDataId: latestHealthData.id,
              type: 'workout',
              suggestionData: generatedResult,
              createdAt: serverTimestamp(),
            });

            setSuggestions(generatedResult);
          }

        } catch (err) {
          console.error('Failed to get suggestions:', err);
          setError("An error occurred while generating your workout plan. Please try again later.");
        } finally {
            setLoading(false);
        }
      };
      fetchAndGenerate();
    } else {
        setLoading(false);
    }
  }, [user]);

  const renderContent = () => {
      if (loading) {
          return (
             <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )
      }
      
      if (error) {
          return (
            <Card className="text-center py-12">
              <Info className="mx-auto h-12 w-12 text-destructive" />
              <h3 className="text-xl font-semibold mt-4">Unable to Generate Plan</h3>
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
                   {suggestions.analysis && (
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
                              <div className="grid sm:grid-cols-2 gap-3">
                                  {dayPlan.exercises.map((exercise, i) => (
                                    <WorkoutExerciseCard key={i} exercise={exercise} />
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
          )
      }
      
      return <p className="text-center text-muted-foreground pt-10">Your workout plan will appear here.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Workout Plans</h1>
        <p className="text-muted-foreground">Weekly workout plans tailored to your complete health profile, generated automatically.</p>
      </div>
      
      <Card className="min-h-full">
        <CardHeader>
          <div>
            <CardTitle>Your Personalized Workout</CardTitle>
            <CardDescription>
              Here is the 7-day workout plan from our AI personal trainer, based on your latest metrics.
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
