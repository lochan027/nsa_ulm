'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { resetSessionTimeout, clearSessionTimeout } from '@/lib/sessionTimeout';

export default function AuthStateWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const publicPaths = ['/', '/login', '/signup'];
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        resetSessionTimeout();
        
        // If on a public path, redirect to dashboard
        if (publicPaths.includes(pathname)) {
          router.push('/dashboard');
        }
      } else {
        // User is signed out
        clearSessionTimeout();
        
        // If not on a public path, redirect to login
        if (!publicPaths.includes(pathname)) {
          router.push('/login');
        }
      }
    });

    return () => {
      unsubscribe();
      clearSessionTimeout();
    };
  }, [router, pathname]);

  return <>{children}</>;
} 