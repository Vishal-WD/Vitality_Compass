
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { HealthData } from '@/lib/types';
import { useAuth } from '@/providers/auth-provider';

import { AddHealthDataDialog } from '@/components/dashboard/add-health-data-dialog';
import { MetricCard } from '@/components/dashboard/metric-card';
import { ProgressChart } from '@/components/dashboard/progress-chart';
import { HealthSummary } from '@/components/dashboard/health-summary';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dumbbell, Heart, Scale, Thermometer, Droplets, Percent } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getHealthData(userId: string) {
      setLoading(true);
      const q = query(
        collection(db, 'healthData'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HealthData));
      setHealthData(data);
      setLoading(false);
    }

    if (user) {
      getHealthData(user.uid);
    }
  }, [user]);

  const latestData = healthData[0];
  const previousData = healthData[1];
  const reversedData = [...healthData].reverse();

  const needsUpdate = () => {
    if (!latestData || !latestData.createdAt) return true;
    // Firestore Timestamps can be either Date objects or server timestamps.
    // We handle both cases here.
    const lastDate = (latestData.createdAt as any).seconds 
      ? new Date((latestData.createdAt as any).seconds * 1000)
      : new Date(latestData.createdAt as any);
      
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    return lastDate < twoWeeksAgo;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Your personal health overview.</p>
        </div>
        <AddHealthDataDialog />
      </div>

      {loading ? (
        <div className="space-y-6">
           <Skeleton className="h-40" />
           <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
             <Skeleton className="h-24" />
             <Skeleton className="h-24" />
             <Skeleton className="h-24" />
             <Skeleton className="h-24" />
             <Skeleton className="h-24" />
             <Skeleton className="h-24" />
           </div>
           <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
             <Skeleton className="h-80" />
             <Skeleton className="h-80" />
             <Skeleton className="h-80" />
             <Skeleton className="h-80" />
           </div>
        </div>
      ) : (
        <>
          {needsUpdate() && !latestData && (
            <Alert>
              <AlertTitle>Time to Update!</AlertTitle>
              <AlertDescription>
                It&apos;s been a while. Add your new health data to track your progress.
              </AlertDescription>
            </Alert>
          )}

          {latestData ? (
            <>
              {previousData && <HealthSummary latestData={latestData} previousData={previousData} />}
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
                <MetricCard title="Weight" value={latestData.weight} unit="kg" icon={Scale} />
                <MetricCard title="BMI" value={latestData.bmi} unit="" icon={Dumbbell} />
                <MetricCard title="Blood Pressure" value={latestData.bloodPressure} unit="" icon={Heart} />
                <MetricCard title="Cholesterol" value={latestData.cholesterol} unit="mg/dL" icon={Droplets} />
                <MetricCard title="Sugar" value={latestData.sugarLevels} unit="mg/dL" icon={Thermometer} />
                <MetricCard title="Body Fat" value={latestData.fats} unit="%" icon={Percent} />
              </div>
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                 <ProgressChart data={reversedData} metric="weight" label="Weight" color="#3F51B5" />
                 <ProgressChart data={reversedData} metric="bmi" label="BMI" color="#4CAF50" />
                 <ProgressChart data={reversedData} metric="cholesterol" label="Cholesterol" color="#FFC107" />
                 <ProgressChart data={reversedData} metric="sugarLevels" label="Sugar Levels" color="#E91E63" />
                 <ProgressChart data={reversedData} metric="fats" label="Body Fat" color="#9C27B0" />
                 <ProgressChart data={reversedData} metric="bloodPressure" label="Blood Pressure" color="#F44336" />
              </div>
            </>
          ) : (
            <Card className="text-center py-12">
              <h3 className="text-xl font-semibold">No Health Data Found</h3>
              <p className="text-muted-foreground mt-2">
                Click &quot;Add New Health Data&quot; to start tracking your progress.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
