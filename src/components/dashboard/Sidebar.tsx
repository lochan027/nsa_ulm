'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { clearSessionTimeout } from '@/lib/sessionTimeout';
import {
  IconHome,
  IconUser,
  IconCalendarEvent,
  IconSettings,
  IconLogout,
  IconMenu2,
  IconX,
  IconUsers,
  IconPhoto,
  IconShirt,
  IconUserCheck
} from '@tabler/icons-react';

interface MenuItem {
  id: number;
  label: string;
  icon: React.ReactNode;
  href: string;
}

const menuItems: MenuItem[] = [
  { id: 1, label: 'Dashboard', icon: <IconHome className="h-5 w-5" />, href: '/dashboard' },
  { id: 2, label: 'Profile', icon: <IconUser className="h-5 w-5" />, href: '/dashboard/profile' },
  { id: 3, label: 'Calendar', icon: <IconCalendarEvent className="h-5 w-5" />, href: '/dashboard/events' },
  { id: 4, label: 'Gallery', icon: <IconPhoto className="h-5 w-5" />, href: '/dashboard/gallery' },
  { id: 5, label: 'Merch', icon: <IconShirt className="h-5 w-5" />, href: '/dashboard/merch' },
  { id: 6, label: 'Students', icon: <IconUsers className="h-5 w-5" />, href: '/dashboard/students' },
  { id: 7, label: 'Check-in', icon: <IconUserCheck className="h-5 w-5" />, href: '/dashboard/checkin' },
  { id: 8, label: 'Settings', icon: <IconSettings className="h-5 w-5" />, href: '/dashboard/settings' },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      clearSessionTimeout();
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="fixed top-4 left-4 z-50 block lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <IconX className="h-6 w-6 text-gray-600" />
        ) : (
          <IconMenu2 className="h-6 w-6 text-gray-600" />
        )}
      </button>

      <motion.div
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "fixed left-0 top-0 h-screen w-72 bg-white border-r border-gray-200 p-6 shadow-lg z-40",
          !isOpen && "hidden lg:block lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-center mb-8 pt-4">
          <Image
            src="/images/nsalogo.png"
            alt="NSA ULM Logo"
            width={100}
            height={100}
            className="w-32 h-32 object-contain"
          />
        </div>

        {/* Menu Items */}
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-lg transition-colors",
                pathname === item.href
                  ? "bg-crimson-50 text-crimson-600"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-8 left-0 w-full px-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <IconLogout className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </motion.div>
    </>
  );
} 