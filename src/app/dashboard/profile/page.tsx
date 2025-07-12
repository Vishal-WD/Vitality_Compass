
'use client';

import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider, linkWithCredential } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';


const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(6, "New password must be at least 6 characters."),
});

const linkAccountSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "" }
  });

  const linkAccountForm = useForm<z.infer<typeof linkAccountSchema>>({
    resolver: zodResolver(linkAccountSchema),
    defaultValues: { email: "", password: "" }
  });

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handlePasswordChange = async (values: z.infer<typeof passwordSchema>) => {
    setLoading(true);

    if (!user || !user.email) {
        toast({ variant: "destructive", title: "Error", description: "Not authenticated with an email account." });
        setLoading(false);
        return;
    }

    const credential = EmailAuthProvider.credential(user.email, values.currentPassword);

    try {
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, values.newPassword);
        toast({ title: "Success", description: "Your password has been updated." });
        passwordForm.reset();
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message || "Failed to update password." });
    } finally {
        setLoading(false);
    }
  };
  
  const handleLinkAccount = async (values: z.infer<typeof linkAccountSchema>) => {
    setLoading(true);
    if (!user) {
        toast({ variant: "destructive", title: "Not authenticated" });
        setLoading(false);
        return;
    }

    const credential = EmailAuthProvider.credential(values.email, values.password);
    
    try {
        await linkWithCredential(user, credential);
        toast({ title: "Account Linked", description: "Your anonymous account has been upgraded." });
        // Force a reload of the user to get the new email address
        await user.reload(); 
        router.refresh(); // Refresh the page to show the new state
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error linking account", description: error.message || "Could not link account." });
    } finally {
        setLoading(false);
    }
  };


  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={user.isAnonymous ? 'Anonymous User (Guest)' : (user.email || '')} disabled />
          </div>
        </CardContent>
      </Card>

      {user.isAnonymous && (
        <Card>
            <CardHeader>
                <CardTitle>Upgrade Your Account</CardTitle>
                <CardDescription>Add an email and password to save your progress and access all features.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...linkAccountForm}>
                    <form onSubmit={linkAccountForm.handleSubmit(handleLinkAccount)} className="space-y-4">
                       <FormField control={linkAccountForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                       <FormField control={linkAccountForm.control} name="password" render={({ field }) => (<FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                       <Button type="submit" disabled={loading}>{loading ? "Linking..." : "Link Account"}</Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
      )}

      {!user.isAnonymous && (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Enter your current and new password to make a change.</CardDescription>
          </CardHeader>
          <CardContent>
             <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                  <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (<FormItem><FormLabel>Current Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (<FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <Button type="submit" disabled={loading}>{loading ? "Updating..." : "Update Password"}</Button>
                </form>
             </Form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Log Out</CardTitle>
          <CardDescription>You will be returned to the login screen.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleLogout}>
            Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
