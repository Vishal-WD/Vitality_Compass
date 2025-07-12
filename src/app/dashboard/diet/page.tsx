
'use client';

import { useState, useEffect, ReactNode, useRef } from 'react';
import { generateDietarySuggestions, GenerateDietarySuggestionsOutput, SuggestionItem } from '@/ai/flows/generate-dietary-suggestions';
import { generateImage } from '@/ai/flows/generate-image';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/providers/auth-provider';
import { HealthData } from '@/lib/types';
import Link from 'next/link';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Apple, Carrot, Fish, Shell, Heart, Droplets, Thermometer, Percent, ShieldCheck, ShieldAlert, TrendingDown, Info, Download } from 'lucide-react';
import Image from 'next/image';

type SuggestionCategory = 'fruits' | 'vegetables' | 'proteins' | 'seedsAndNuts';

interface SuggestionItemWithImage extends SuggestionItem {
    imageUrl: string;
}

const DietSuggestionCard = ({ item }: { item: SuggestionItemWithImage }) => {
    return (
        <Card>
            <CardContent className="p-0">
                <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={400}
                    height={300}
                    className="rounded-t-lg object-cover aspect-[4/3]"
                    data-ai-hint={item.imageHint}
                />
                <div className="p-4">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{item.reason}</p>
                </div>
            </CardContent>
        </Card>
    );
};

// Helper function to process promises in batches
async function processInBatches<T, R>(items: T[], processor: (item: T) => Promise<R>, batchSize: number): Promise<R[]> {
    let results: R[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(processor));
        results = results.concat(batchResults);
    }
    return results;
}


export default function DietPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [suggestions, setSuggestions] = useState<(Omit<GenerateDietarySuggestionsOutput, SuggestionCategory> & Record<SuggestionCategory, SuggestionItemWithImage[]>) | null>(null);
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

          const textResult = await generateDietarySuggestions(plainData);
          
          // Generate all images in batches to avoid rate limiting
          const allItems: { item: SuggestionItem, category: SuggestionCategory }[] = [];
          (Object.keys(textResult) as SuggestionCategory[]).forEach(key => {
              if (Array.isArray(textResult[key])) {
                  textResult[key].forEach(item => allItems.push({ item, category: key }));
              }
          });

          const imageProcessor = async ({item}: {item: SuggestionItem}) => {
             try {
                const result = await generateImage({ hint: item.imageHint });
                return { ...item, imageUrl: result.imageUrl };
             } catch(e) {
                console.error("Image generation failed for:", item.imageHint, e);
                return { ...item, imageUrl: `https://placehold.co/400x300.png`};
             }
          };
          
          const itemsWithImages = await processInBatches(allItems, imageProcessor, 5);

          const suggestionsWithImages = {
              ...textResult,
              fruits: itemsWithImages.filter((_, i) => allItems[i].category === 'fruits'),
              vegetables: itemsWithImages.filter((_, i) => allItems[i].category === 'vegetables'),
              proteins: itemsWithImages.filter((_, i) => allItems[i].category === 'proteins'),
              seedsAndNuts: itemsWithImages.filter((_, i) => allItems[i].category === 'seedsAndNuts'),
          };

          setSuggestions(suggestionsWithImages);

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
        pdf.save('VitalityCompass-DietPlan.pdf');
    } catch(err) {
        console.error("Failed to generate PDF:", err);
    } finally {
        setDownloading(false);
    }
  };

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
                        <Skeleton className="h-40 w-full rounded-md" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-full" />
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
        <div className="space-y-6" ref={printableRef}>
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
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>Your Personalized Suggestions</CardTitle>
                  <CardDescription>
                  Here are the dietary recommendations from our AI assistant, based on your latest metrics.
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
