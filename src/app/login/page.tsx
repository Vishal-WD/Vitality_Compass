
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/app/logo';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningInAnonymously, setIsSigningInAnonymously] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Login Successful',
        description: "Welcome back! You're being redirected to your dashboard.",
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'An unexpected error occurred. Please try again.',
      });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  async function handleAnonymousLogin() {
    setIsSigningInAnonymously(true);
    try {
      await signInAnonymously(auth);
      toast({
        title: 'Signed In Anonymously',
        description: "You're being redirected to your dashboard. You can create a full account later.",
      });
      router.push('/dashboard');
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'An unexpected error occurred. Please try again.',
      });
    } finally {
        setIsSigningInAnonymously(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
             <Logo />
          </div>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Sign in to continue to your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting || isSigningInAnonymously}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting || isSigningInAnonymously}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || isSigningInAnonymously}>
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
           <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="underline text-primary">
              Sign up
            </Link>
          </div>
          <div className="relative my-4">
            <Separator />
            <span className="absolute left-1/2 -translate-x-1/2 top-[-10px] bg-card px-2 text-xs text-muted-foreground">OR</span>
          </div>
           <Button variant="secondary" className="w-full" onClick={handleAnonymousLogin} disabled={isSubmitting || isSigningInAnonymously}>
            {isSigningInAnonymously ? 'Signing In...' : 'Continue as Guest'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
