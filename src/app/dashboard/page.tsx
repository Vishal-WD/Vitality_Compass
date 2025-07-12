import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { HealthData } from '@/lib/types';
import { getAuth } from "firebase/auth";
import { headers } from "next/headers";

import { AddHealthDataDialog } from '@/components/dashboard/add-health-data-dialog';
import { MetricCard } from '@/components/dashboard/metric-card';
import { ProgressChart } from '@/components/dashboard/progress-chart';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Barbell, Heart, Scale, Thermometer, Droplets, Percent } from 'lucide-react';

async function getHealthData(userId: string): Promise<HealthData[]> {
  const q = query(
    collection(db, 'healthData'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HealthData));
}

export default async function DashboardPage() {
    
  // This is a workaround to get the user on the server.
  // In a real app, you would likely use a session management library or NextAuth.js
  // For now we will assume the user is authenticated from the layout.
  // We cannot use the `auth` object directly on the server without more setup.
  // The layout will handle the redirect if user is not authenticated.
  // We can't call getAuth() on server components directly.
  const DUMMY_USER_ID_FOR_SERVER_RENDERING = "server_user_id";
  // Since we can't get current user on server component easily without a full auth library,
  // we are fetching for all users in this example.
  // IN A REAL APP: replace this with a query for the currently logged-in user.
  // const healthData = await getHealthData(auth.currentUser.uid);
  
  const healthDataQuery = query(
    collection(db, 'healthData'),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(healthDataQuery);
  const healthData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HealthData));


  const latestData = healthData[0];

  const needsUpdate = () => {
    if (!latestData || !latestData.createdAt) return true;
    const lastDate = new Date((latestData.createdAt as any).seconds * 1000);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    return lastDate < twoWeeksAgo;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Your personal health overview.</p>
        </div>
        <AddHealthDataDialog />
      </div>

      {needsUpdate() && (
        <Alert>
          <AlertTitle>Time to Update!</AlertTitle>
          <AlertDescription>
            It&apos;s been over two weeks since your last entry. Add your new health data to track your progress.
          </AlertDescription>
        </Alert>
      )}

      {latestData ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <MetricCard title="Weight" value={latestData.weight} unit="kg" icon={Scale} />
            <MetricCard title="BMI" value={latestData.bmi} unit="" icon={Barbell} />
            <MetricCard title="Blood Pressure" value={latestData.bloodPressure} unit="" icon={Heart} />
            <MetricCard title="Cholesterol" value={latestData.cholesterol} unit="mg/dL" icon={Droplets} />
            <MetricCard title="Sugar" value={latestData.sugarLevels} unit="mg/dL" icon={Thermometer} />
            <MetricCard title="Body Fat" value={latestData.fats} unit="%" icon={Percent} />
          </div>
          <div className="grid gap-4 md:grid-cols-1">
             <ProgressChart data={[...healthData].reverse()} metric="weight" label="Weight" color="#3F51B5" />
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
    </div>
  );
}
