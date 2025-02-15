'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { UserProfile, UserClassification, UserRole } from '@/lib/firebase';
import { IconEdit } from '@tabler/icons-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    classification: 'Freshman' as UserClassification,
    role: 'Not a Member' as UserRole
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setProfile(data);
          setFormData({
            classification: data.classification,
            role: data.role
          });
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !profile) return;

    try {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const updatedProfile: Partial<UserProfile> = {
        classification: formData.classification,
        role: formData.role
      };
      await updateDoc(docRef, updatedProfile);
      setProfile(prev => prev ? { ...prev, ...updatedProfile } : null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-crimson-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-crimson-600 hover:text-crimson-700"
            >
              <IconEdit className="h-4 w-4" />
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="classification" className="block text-sm font-medium text-gray-700">
                  Classification
                </label>
                <select
                  id="classification"
                  value={formData.classification}
                  onChange={(e) => setFormData(prev => ({ ...prev, classification: e.target.value as UserClassification }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-crimson-500 focus:ring-crimson-500"
                >
                  <option value="Freshman">Freshman</option>
                  <option value="Sophomore">Sophomore</option>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-crimson-500 focus:ring-crimson-500"
                  disabled // Only admins can change roles
                >
                  <option value="Not a Member">Not a Member</option>
                  <option value="Member">Member</option>
                  <option value="Board Member">Board Member</option>
                  <option value="President">President</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Note: Roles can only be changed by administrators
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-crimson-600 text-white rounded-md hover:bg-crimson-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                <p className="mt-1 text-sm text-gray-900">{profile?.firstName} {profile?.lastName}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Classification</h3>
                <p className="mt-1 text-sm text-gray-900">{profile?.classification}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Role</h3>
                <p className="mt-1 text-sm text-gray-900">{profile?.role}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="mt-1 text-sm text-gray-900">{profile?.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 