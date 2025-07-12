
'use client';

import { useState, useEffect, ReactNode } from 'react';
import { generateHealthSummary, GenerateHealthSummaryOutput } from '@/ai/flows/generate-health-summary';
import type { HealthData } from '@/lib/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, CheckCircle, XCircle, ArrowRightCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HealthSummaryProps {
  latestData: HealthData;
  previousData: HealthData;
}

export function HealthSummary({ latestData, previousData }: HealthSummaryProps) {
  const [summary, setSummary] = useState<GenerateHealthSummaryOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSummary = async () => {
      setLoading(true);
      try {
        const result = await generateHealthSummary({ latestData, previousData });
        setSummary(result);
      } catch (error) {
        console.error("Failed to generate health summary:", error);
        // Do not render the component if there's an error
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    getSummary();
  }, [latestData, previousData]);

  const statusIcons: Record<string, ReactNode> = {
    Improved: <TrendingUp className="h-5 w-5 text-green-500" />,
    Declined: <TrendingDown className="h-5 w-5 text-red-500" />,
    Maintained: <Minus className="h-5 w-5 text-muted-foreground" />,
  };
  
  const overallStatusIcons: Record<string, ReactNode> = {
    Improved: <CheckCircle className="h-8 w-8 text-green-500" />,
    Declined: <XCircle className="h-8 w-8 text-red-500" />,
    Maintained: <ArrowRightCircle className="h-8 w-8 text-blue-500" />,
  }

  if (loading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
                </div>
            </CardContent>
        </Card>
    )
  }

  if (!summary) {
    return null; // Don't render anything if there's no summary
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
            {overallStatusIcons[summary.overallStatus]}
            <div>
                 <CardTitle className="text-2xl">Your Progress Summary</CardTitle>
                 <CardDescription>{summary.summaryText}</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {summary.metricChanges.map(metric => (
            <div key={metric.metric} className="flex items-start gap-3 rounded-lg border p-4">
                {statusIcons[metric.status]}
                <div className="flex-1">
                    <p className="font-semibold">{metric.metric}: <span className="text-primary">{metric.change}</span></p>
                    <p className="text-sm text-muted-foreground">{metric.comment}</p>
                </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
