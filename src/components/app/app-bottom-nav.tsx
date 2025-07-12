
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems } from './app-sidebar';
import { cn } from '@/lib/utils';

export function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-10">
      <div className="grid h-full grid-cols-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
