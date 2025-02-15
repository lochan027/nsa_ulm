'use client';

import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addYears, subYears, isBefore, isAfter, addMonths, subMonths } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, deleteDoc, updateDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import type { UserProfile } from '@/lib/firebase';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location: string;
  description: string;
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {
    'en-US': enUS,
  },
});

export default function EventsPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<CalendarEvent>({
    id: '',
    title: '',
    start: new Date(),
    end: new Date(),
    location: '',
    description: '',
  });

  const canEditEvents = userProfile?.role === 'Board Member' || userProfile?.role === 'President';

  // Add these date constraints
  const today = new Date();
  const minDate = subYears(today, 1);
  const maxDate = addYears(today, 1);

  const handleNavigate = (newDate: Date) => {
    if (newDate >= minDate && newDate <= maxDate) {
      setCurrentDate(newDate);
    }
  };

  useEffect(() => {
    const fetchUserProfileAndEvents = async () => {
      if (auth.currentUser) {
        // Fetch user profile
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data() as UserProfile);
        }

        // Fetch events
        const eventsQuery = query(collection(db, 'events'), orderBy('start'));
        const querySnapshot = await getDocs(eventsQuery);
        const fetchedEvents = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            start: data.start.toDate(),
            end: data.end.toDate(),
            location: data.location,
            description: data.description,
          };
        });
        setEvents(fetchedEvents);
      }
      setLoading(false);
    };

    fetchUserProfileAndEvents();
  }, []);

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEditing(false);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditEvents || !selectedEvent) return;

    // Validate dates
    if (selectedEvent.start > selectedEvent.end) {
      setError('Start date cannot be after end date');
      return;
    }

    try {
      setError(null);
      const { title, start, end, location, description } = selectedEvent;
      const eventData = {
        title,
        start: Timestamp.fromDate(start),
        end: Timestamp.fromDate(end),
        location,
        description,
      };
      
      const eventRef = doc(db, 'events', selectedEvent.id);
      await updateDoc(eventRef, eventData);
      setEvents(prevEvents => 
        prevEvents.map(event => event.id === selectedEvent.id ? selectedEvent : event)
      );
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating event:', error);
      setError('Failed to update event');
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditEvents) return;

    // Validate dates
    if (newEvent.start > newEvent.end) {
      setError('Start date cannot be after end date');
      return;
    }

    try {
      setError(null);
      const { title, start, end, location, description } = newEvent;
      const eventData = {
        title,
        start: Timestamp.fromDate(start),
        end: Timestamp.fromDate(end),
        location,
        description,
      };
      
      const docRef = await addDoc(collection(db, 'events'), eventData);
      const addedEvent: CalendarEvent = {
        ...newEvent,
        id: docRef.id,
      };
      setEvents(prevEvents => [...prevEvents, addedEvent]);
      setNewEvent({
        id: '',
        title: '',
        start: new Date(),
        end: new Date(),
        location: '',
        description: '',
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error adding event:', error);
      setError('Failed to add event');
    }
  };

  const handleDeleteEvent = async () => {
    if (!canEditEvents || !selectedEvent) return;

    try {
      await deleteDoc(doc(db, 'events', selectedEvent.id));
      setEvents(prevEvents => prevEvents.filter(event => event.id !== selectedEvent.id));
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
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
    <div className="max-w-7xl mx-auto">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Events Calendar</h1>
            {canEditEvents && (
              <button
                onClick={() => {
                  setSelectedEvent(null);
                  setIsEditing(true);
                }}
                className="px-4 py-2 bg-crimson-600 text-white rounded-md hover:bg-crimson-700"
              >
                Add New Event
              </button>
            )}
          </div>

          <div className="mb-8" style={{ height: '500px' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              onSelectEvent={handleSelectEvent}
              style={{ height: '100%' }}
              views={['month']}
              defaultView="month"
              date={currentDate}
              onNavigate={handleNavigate}
              min={minDate}
              max={maxDate}
              components={{
                toolbar: (props) => (
                  <div className="rbc-toolbar flex items-center justify-between p-4 border-b">
                    <span className="rbc-btn-group flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const prevMonth = new Date(props.date);
                          prevMonth.setMonth(prevMonth.getMonth() - 1);
                          handleNavigate(prevMonth);
                        }}
                        disabled={isBefore(props.date, addMonths(minDate, 1))}
                        className={`px-4 py-2 rounded-md transition-colors ${
                          isBefore(props.date, addMonths(minDate, 1))
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavigate(new Date())}
                        className="px-4 py-2 bg-crimson-600 text-white rounded-md hover:bg-crimson-700 transition-colors"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const nextMonth = new Date(props.date);
                          nextMonth.setMonth(nextMonth.getMonth() + 1);
                          handleNavigate(nextMonth);
                        }}
                        disabled={isAfter(props.date, subMonths(maxDate, 1))}
                        className={`px-4 py-2 rounded-md transition-colors ${
                          isAfter(props.date, subMonths(maxDate, 1))
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Next
                      </button>
                    </span>
                    <span className="rbc-toolbar-label text-lg font-semibold text-gray-900">
                      {format(props.date, 'MMMM yyyy')}
                    </span>
                    <span className="w-[120px]"></span>
                  </div>
                ),
              }}
            />
          </div>

          {selectedEvent && !isEditing && (
            <div className="mt-6 p-4 border border-gray-200 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">{selectedEvent.title}</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Start:</span> {format(selectedEvent.start, 'PPpp')}</p>
                <p><span className="font-medium">End:</span> {format(selectedEvent.end, 'PPpp')}</p>
                <p><span className="font-medium">Location:</span> {selectedEvent.location}</p>
                <p><span className="font-medium">Description:</span> {selectedEvent.description}</p>
              </div>
              {canEditEvents && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteEvent}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}

          {isEditing && (
            <form onSubmit={selectedEvent ? handleUpdateEvent : handleAddEvent} className="mt-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={selectedEvent?.title || newEvent.title}
                  onChange={(e) => {
                    setError(null);
                    if (selectedEvent) {
                      setSelectedEvent({ ...selectedEvent, title: e.target.value });
                    } else {
                      setNewEvent({ ...newEvent, title: e.target.value });
                    }
                  }}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={format(selectedEvent?.start || newEvent.start, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => {
                      setError(null);
                      const date = new Date(e.target.value);
                      if (selectedEvent) {
                        setSelectedEvent({ ...selectedEvent, start: date });
                      } else {
                        setNewEvent({ ...newEvent, start: date });
                      }
                    }}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={format(selectedEvent?.end || newEvent.end, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => {
                      setError(null);
                      const date = new Date(e.target.value);
                      if (selectedEvent) {
                        setSelectedEvent({ ...selectedEvent, end: date });
                      } else {
                        setNewEvent({ ...newEvent, end: date });
                      }
                    }}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={selectedEvent?.location || newEvent.location}
                  onChange={(e) => {
                    if (selectedEvent) {
                      setSelectedEvent({ ...selectedEvent, location: e.target.value });
                    } else {
                      setNewEvent({ ...newEvent, location: e.target.value });
                    }
                  }}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={selectedEvent?.description || newEvent.description}
                  onChange={(e) => {
                    if (selectedEvent) {
                      setSelectedEvent({ ...selectedEvent, description: e.target.value });
                    } else {
                      setNewEvent({ ...newEvent, description: e.target.value });
                    }
                  }}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  rows={4}
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-crimson-600 text-white rounded-md hover:bg-crimson-700"
                >
                  {selectedEvent ? 'Update Event' : 'Add Event'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedEvent(null);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 