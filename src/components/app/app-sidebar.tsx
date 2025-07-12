'use client';

import { usePathname, useRouter } from 'next/navigation';
import { signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Dumbbell,
  Salad,
  User as UserIcon,
  LogOut,
  Settings,
} from 'lucide-react';
import Logo from './logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { SheetTitle } from '../ui/sheet';

interface AppSidebarProps {
  user: User;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/diet', label: 'Diet Suggestions', icon: Salad },
  { href: '/dashboard/workout', label: 'Workout Plans', icon: Dumbbell },
  { href: '/dashboard/profile', label: 'Profile', icon: UserIcon },
];

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const getInitials = (email: string | null) => {
    return email ? email.charAt(0).toUpperCase() : 'U';
  };

  return (
    <Sidebar>
       <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                onClick={() => router.push(item.href)}
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start h-12 p-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL ?? ''} />
                  <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                </Avatar>
                <div className="text-left overflow-hidden">
                  <p className="font-medium text-sm truncate">{user.displayName || user.email}</p>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mb-2" side="top" align="start">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
