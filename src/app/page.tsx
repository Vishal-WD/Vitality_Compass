import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/app/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, HeartPulse, Salad } from 'lucide-react';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
        <Logo />
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 lg:py-32">
           <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="text-left">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-primary">
                        Navigate Your Health Journey
                    </h1>
                    <p className="mt-4 max-w-2xl text-lg lg:text-xl text-muted-foreground">
                        Vitality Compass is your personal health dashboard to track metrics, get AI-powered insights, and build a healthier lifestyle.
                    </p>
                    <div className="mt-8 flex gap-4">
                        <Button size="lg" asChild>
                        <Link href="/signup">Get Started for Free</Link>
                        </Button>
                    </div>
                </div>
                <div className="relative h-64 md:h-96">
                    <Image 
                        src="https://placehold.co/600x400.png" 
                        alt="An anime-style illustration of a person energetically running through a park with health icons floating around."
                        data-ai-hint="anime health"
                        fill
                        priority
                        className="object-cover rounded-lg shadow-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>
           </div>
        </section>

        <section className="bg-white dark:bg-card py-20 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Features to Guide You</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center flex flex-col">
                <CardHeader className="flex-1">
                  <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit">
                    <HeartPulse className="h-8 w-8" />
                  </div>
                  <CardTitle className="mt-4">Track Your Vitals</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Easily log and monitor key health metrics like blood pressure, weight, and more. See your progress with intuitive charts.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="text-center flex flex-col">
                <CardHeader className="flex-1">
                   <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit">
                    <Salad className="h-8 w-8" />
                  </div>
                  <CardTitle className="mt-4">AI Diet Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Receive personalized dietary recommendations based on your unique health profile to help you eat smarter.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="text-center flex flex-col">
                <CardHeader className="flex-1">
                   <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit">
                    <Dumbbell className="h-8 w-8" />
                  </div>
                  <CardTitle className="mt-4">Custom Workout Plans</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Get workout plans tailored to your age, weight, and fitness goals, powered by our intelligent suggestion engine.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Vitality Compass. All rights reserved.</p>
      </footer>
    </div>
  );
}
