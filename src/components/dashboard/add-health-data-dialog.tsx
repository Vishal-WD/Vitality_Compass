'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { healthDataSchema } from '@/lib/types';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';

type HealthDataFormValues = z.infer<typeof healthDataSchema>;

export function AddHealthDataDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<HealthDataFormValues>({
    resolver: zodResolver(healthDataSchema),
    defaultValues: {
      height: 0,
      weight: 0,
      age: 0,
      bloodPressure: '120/80',
      cholesterol: 0,
      sugarLevels: 0,
      fats: 0,
      bloodPoints: 0,
    },
  });

  async function onSubmit(values: HealthDataFormValues) {
    const user = auth.currentUser;
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }

    try {
      const bmi = parseFloat((values.weight / ((values.height / 100) ** 2)).toFixed(2));
      await addDoc(collection(db, 'healthData'), {
        ...values,
        userId: user.uid,
        createdAt: serverTimestamp(),
        bmi: isNaN(bmi) ? 0 : bmi,
      });
      toast({ title: 'Success', description: 'Health data saved.' });
      form.reset();
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save data.' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add New Health Data</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log New Health Data</DialogTitle>
          <DialogDescription>
            Enter your latest health metrics. This will be saved with today's date.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-96 pr-6">
                <div className="space-y-4 py-4">
                <FormField control={form.control} name="height" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Height (cm)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="weight" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="age" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="bloodPressure" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Blood Pressure (e.g., 120/80)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="cholesterol" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Cholesterol (mg/dL)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="sugarLevels" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Sugar Levels (mg/dL)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="fats" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Body Fat (%)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="bloodPoints" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Blood Points</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                </div>
            </ScrollArea>
             <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Saving..." : "Save Data"}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
