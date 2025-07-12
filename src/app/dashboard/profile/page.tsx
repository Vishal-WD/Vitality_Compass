
'use client';

import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { useState } from 'react';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);


  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!user) {
        toast({ variant: "destructive", title: "Not authenticated" });
        setLoading(false);
        return;
    }
    
    if (!user.email) {
        toast({ variant: "destructive", title: "No Email Associated", description: "You must have an email associated with your account to change the password." });
        setLoading(false);
        return;
    }

    if(newPassword.length < 6) {
        toast({ variant: "destructive", title: "Password too short", description: "Password must be at least 6 characters." });
        setLoading(false);
        return;
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);

    try {
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        toast({ title: "Success", description: "Your password has been updated." });
        setNewPassword('');
        setCurrentPassword('');
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message || "Failed to update password." });
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
            <Input id="email" type="email" value={user.email || 'Anonymous User'} disabled />
          </div>
        </CardContent>
      </Card>

      {user.email && (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Enter your current and new password to make a change.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              </div>
              <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>
              <Button type="submit" disabled={loading}>{loading ? "Updating..." : "Update Password"}</Button>
            </form>
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
