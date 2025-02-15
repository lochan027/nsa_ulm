'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, getDocs, addDoc, where, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/firebase';
import { IconPlus, IconExternalLink, IconTrash } from '@tabler/icons-react';
import Image from 'next/image';

const DEFAULT_IMAGE = '/images/nsalogo.png'; // Fallback image

interface EventGallery {
  id: string;
  title: string;
  date: Timestamp;
  description: string;
  imageUrl: string;
  driveLink: string;
}

// Add this function after the DEFAULT_IMAGE constant
const convertGoogleDriveLink = (url: string): string => {
  try {
    // Check if it's already in the correct format
    if (url.includes('drive.google.com/uc?')) {
      return url;
    }
    
    // Extract file ID from various Google Drive URL formats
    let fileId = '';
    if (url.includes('drive.google.com/file/d/')) {
      fileId = url.split('drive.google.com/file/d/')[1].split('/')[0];
    } else if (url.includes('drive.google.com/open?id=')) {
      fileId = url.split('drive.google.com/open?id=')[1].split('&')[0];
    } else if (url.includes('drive.google.com/uc?id=')) {
      fileId = url.split('drive.google.com/uc?id=')[1].split('&')[0];
    }
    
    if (!fileId) {
      return url; // Return original URL if we can't extract the ID
    }
    
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  } catch (error) {
    console.error('Error converting Google Drive link:', error);
    return url;
  }
};

export default function GalleryPage() {
  const [events, setEvents] = useState<EventGallery[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    description: '',
    imageUrl: '',
    driveLink: '',
  });

  const canAddEvents = userProfile?.role === 'Board Member' || userProfile?.role === 'President';
  const canViewGallery = userProfile?.role === 'Member' || userProfile?.role === 'Board Member' || userProfile?.role === 'President';

  useEffect(() => {
    const fetchUserProfileAndEvents = async () => {
      if (auth.currentUser) {
        // Fetch user profile
        const userDocSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', auth.currentUser.uid)));
        if (!userDocSnap.empty) {
          setUserProfile(userDocSnap.docs[0].data() as UserProfile);
        }

        // Fetch events
        const eventsQuery = query(collection(db, 'gallery'));
        const querySnapshot = await getDocs(eventsQuery);
        const fetchedEvents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as EventGallery[];

        // Sort events by date
        fetchedEvents.sort((a, b) => b.date.toMillis() - a.date.toMillis());
        setEvents(fetchedEvents);
      }
      setLoading(false);
    };

    fetchUserProfileAndEvents();
  }, []);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddEvents) return;

    try {
      setError(null);
      const eventData = {
        ...newEvent,
        date: Timestamp.fromDate(new Date(newEvent.date)),
      };

      const docRef = await addDoc(collection(db, 'gallery'), eventData);
      const addedEvent: EventGallery = {
        id: docRef.id,
        ...eventData,
      };

      setEvents(prev => [addedEvent, ...prev]);
      setIsAddingEvent(false);
      setNewEvent({
        title: '',
        date: '',
        description: '',
        imageUrl: '',
        driveLink: '',
      });
    } catch (error) {
      console.error('Error adding event:', error);
      setError('Failed to add event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!canAddEvents) return; // Only board members and presidents can delete

    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'gallery', eventId));
      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-crimson-600"></div>
      </div>
    );
  }

  if (!canViewGallery) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You need to be at least a member to view the gallery.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Event Gallery</h1>
            {canAddEvents && (
              <button
                onClick={() => setIsAddingEvent(true)}
                className="flex items-center gap-2 px-4 py-2 bg-crimson-600 text-white rounded-md hover:bg-crimson-700"
              >
                <IconPlus className="h-5 w-5" />
                Add Gallery
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event.id} className="bg-white border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <div className="relative h-48">
                  <Image
                    src={event.imageUrl ? convertGoogleDriveLink(event.imageUrl) : DEFAULT_IMAGE}
                    alt={event.title}
                    fill
                    className="object-cover"
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                      const target = e.target as HTMLImageElement;
                      target.src = DEFAULT_IMAGE;
                    }}
                  />
                  {canAddEvents && (
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                      title="Delete event"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {event.date.toDate().toLocaleDateString()}
                  </p>
                  <p className="text-gray-600 mt-2 line-clamp-3">{event.description}</p>
                  <a
                    href={event.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 text-crimson-600 hover:text-crimson-700"
                  >
                    View Photos
                    <IconExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Add Event Modal */}
          {isAddingEvent && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-semibold mb-4">Add New Event</h2>
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}
                <form onSubmit={handleAddEvent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Event Title</label>
                    <input
                      type="text"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Event Date</label>
                    <input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={newEvent.description}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      rows={3}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cover Image URL (Optional)</label>
                    <input
                      type="url"
                      value={newEvent.imageUrl}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      placeholder="Paste your Google Drive sharing link here (or leave empty for default image)"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      You can use a Google Drive sharing link or a direct image URL. Leave empty to use default image.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Google Drive Link</label>
                    <input
                      type="url"
                      value={newEvent.driveLink}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, driveLink: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-crimson-600 text-white rounded-md hover:bg-crimson-700"
                    >
                      Add Event
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingEvent(false);
                        setError(null);
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 