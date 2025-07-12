
'use client';

import { useState, useEffect, ReactNode, useRef } from 'react';
import { generateWorkoutSuggestions, WorkoutSuggestionsOutput, Exercise, DailyPlanSchema } from '@/ai/flows/generate-workout-suggestions';
import { generateImage } from '@/ai/flows/generate-image';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/providers/auth-provider';
import { HealthData } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, ShieldAlert, TrendingDown, HeartPulse, Heart, Droplets, Thermometer, Percent, Info, Download } from 'lucide-react';
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

interface ExerciseWithImage extends Exercise {
    imageUrl: string;
}

const WorkoutExerciseCard = ({ exercise }: { exercise: ExerciseWithImage }) => {
    return (
        <div className="flex items-start gap-4 p-4 rounded-lg border">
            <Image
                src={exercise.imageUrl || `https://placehold.co/100x100.png`}
                alt={exercise.name}
                width={80}
                height={80}
                className="rounded-md object-cover aspect-square"
                data-ai-hint={exercise.imageHint}
            />
            <div className="flex-1">
                <p className="font-semibold">{exercise.name}</p>
                <p className="text-sm text-muted-foreground">{exercise.sets} &bull; {exercise.reps}</p>
            </div>
        </div>
    );
};

interface DailyPlanWithImages extends Omit<z.infer<typeof DailyPlanSchema>, 'exercises'> {
    exercises: ExerciseWithImage[];
}

interface SuggestionsWithImages extends Omit<WorkoutSuggestionsOutput, 'weeklyPlan'> {
    weeklyPlan: DailyPlanWithImages[];
}


export default function WorkoutPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionsWithImages | null>(null);
  const [error, setError] = useState<string | null>(null);
  const printableRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (user) {
      const fetchAndGenerate = async () => {
        setLoading(true);
        setError(null);
        setSuggestions(null);

        try {
          const q = query(
            collection(db, 'healthData'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            setError("No health data found. Please add your data on the dashboard page first.");
            setLoading(false);
            return;
          }
          
          const latestData = querySnapshot.docs[0].data() as HealthData;
          
          const { createdAt, userId, ...plainData } = latestData;
          
          const textResult = await generateWorkoutSuggestions(plainData);
          
          // Generate all images in parallel
          const allExercises = textResult.weeklyPlan.flatMap(day => day.exercises);
          const imagePromises = allExercises.map(async (exercise) => {
             try {
                const result = await generateImage({ hint: exercise.imageHint, style: 'anime' });
                return { ...exercise, imageUrl: result.imageUrl };
             } catch(e) {
                console.error("Image generation failed for:", exercise.imageHint, e);
                return { ...exercise, imageUrl: `https://placehold.co/100x100.png`};
             }
          });
          
          const exercisesWithImages = await Promise.all(imagePromises);
          
          let exerciseIndex = 0;
          const weeklyPlanWithImages = textResult.weeklyPlan.map(day => ({
              ...day,
              exercises: day.exercises.map(() => exercisesWithImages[exerciseIndex++])
          }));

          setSuggestions({
              ...textResult,
              weeklyPlan: weeklyPlanWithImages,
          });

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

  const handleDownload = async () => {
    if (!printableRef.current) return;
    setDownloading(true);
    try {
        const canvas = await html2canvas(printableRef.current, {
            useCORS: true,
            scale: 2, 
            backgroundColor: null, 
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'px',
            format: [canvas.width, canvas.height],
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save('VitalityCompass-WorkoutPlan.pdf');
    } catch(err) {
        console.error("Failed to generate PDF:", err);
    } finally {
        setDownloading(false);
    }
  };

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
              <div className="space-y-6" ref={printableRef}>
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
                              <div className="space-y-4">
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
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Your Personalized Workout</CardTitle>
            <CardDescription>
              Here is the 7-day workout plan from our AI personal trainer, based on your latest metrics.
            </CardDescription>
          </div>
           <Button variant="outline" onClick={handleDownload} disabled={loading || downloading || !suggestions}>
              <Download className="mr-2 h-4 w-4" />
              {downloading ? 'Downloading...' : 'Download'}
           </Button>
        </CardHeader>
        <CardContent>
           {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
