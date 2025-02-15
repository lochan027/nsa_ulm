'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { UserRole } from '@/lib/firebase';

interface MemberCounts {
  total: number;
  members: number;
  boardMembers: number;
  president: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberCounts, setMemberCounts] = useState<MemberCounts>({
    total: 0,
    members: 0,
    boardMembers: 0,
    president: 0
  });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchMemberCounts();
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchMemberCounts = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const counts: MemberCounts = {
        total: 0,
        members: 0,
        boardMembers: 0,
        president: 0
      };

      snapshot.forEach((doc) => {
        const userData = doc.data();
        const role = userData.role as UserRole;
        
        counts.total++;
        switch (role) {
          case 'Member':
            counts.members++;
            break;
          case 'Board Member':
            counts.boardMembers++;
            break;
          case 'President':
            counts.president++;
            break;
        }
      });

      setMemberCounts(counts);
    } catch (error) {
      console.error('Error fetching member counts:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-crimson-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Welcome Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to NSA ULM!</h1>
          <p className="text-gray-600 mb-4">
            Hello, {user?.email}! You&apos;re now logged into your NSA ULM account.
          </p>
        </div>

        {/* Active Members Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Members</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Members:</span>
              <span className="font-semibold text-lg">{memberCounts.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Regular Members:</span>
              <span className="font-semibold text-lg text-blue-600">{memberCounts.members}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Board Members:</span>
              <span className="font-semibold text-lg text-crimson-600">{memberCounts.boardMembers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">President:</span>
              <span className="font-semibold text-lg text-green-600">{memberCounts.president}</span>
            </div>
          </div>
        </div>

        {/* Upcoming Events Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Upcoming Events</h2>
          <p className="text-gray-600">Stay tuned for upcoming events and activities!</p>
        </div>

        {/* Quick Links Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Quick Links</h2>
          <div className="space-y-2">
            <button 
              onClick={() => router.push('/dashboard/events')}
              className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md"
            >
              View Calendar →
            </button>
            <button 
              onClick={() => router.push('/dashboard/gallery')}
              className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md"
            >
              Browse Gallery →
            </button>
            <button 
              onClick={() => router.push('/dashboard/merch')}
              className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md"
            >
              Shop Merchandise →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 