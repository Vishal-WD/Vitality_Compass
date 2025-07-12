import { Compass } from 'lucide-react';
import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Vitality Compass Home">
      <Compass className="h-7 w-7 text-primary" />
      <span className="text-xl font-bold tracking-tight">Vitality Compass</span>
    </Link>
  );
}
