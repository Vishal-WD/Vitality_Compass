
'use client';

import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import the AppSidebar as it's not needed for unauthenticated users
const AppSidebar = dynamic(() => import('@/components/app/app-sidebar').then(mod => mod.AppSidebar), {
  loading: () => <Skeleton className="w-64 h-screen" />,
});

function DashboardLoadingSkeleton() {
  return (
     <div className="flex items-center justify-center h-screen">
       <div className="space-y-4 w-full max-w-4xl p-4">
           <Skeleton className="h-12 w-full" />
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
           </div>
           <Skeleton className="h-64 w-full" />
       </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    // AuthProvider already shows a loading screen, so this is for the brief moment after auth resolves
    return <DashboardLoadingSkeleton />;
  }

  return (
    <SidebarProvider>
        <AppSidebar user={user} />
        <SidebarInset>
            <main className="flex-1 p-4 md:p-6 lg:p-8">
              <Suspense fallback={<DashboardLoadingSkeleton />}>
                {children}
              </Suspense>
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
