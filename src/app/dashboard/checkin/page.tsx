'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, getDocs, where, addDoc, doc, getDoc, Timestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/firebase';
import { IconPlus, IconDownload, IconUserPlus, IconSearch, IconTrash } from '@tabler/icons-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Add type declaration for jspdf-autotable
interface AutoTableOptions {
  startY: number;
  head: string[][];
  body: (string | number)[][];
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => void;
  }
}

interface CheckInEvent {
  id: string;
  name: string;
  date: Timestamp;
  isActive: boolean;
  checkedInUsers: CheckInRecord[];
}

interface CheckInRecord {
  userId?: string;
  cwid?: string;
  name: string;
  email?: string;
  timestamp: Timestamp;
  isGuest: boolean;
  isMember: boolean;
  additionalInfo?: string;
}

export default function CheckInPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CheckInEvent[]>([]);
  const [activeEvent, setActiveEvent] = useState<CheckInEvent | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [cwidInput, setCwidInput] = useState('');
  const [checkInStatus, setCheckInStatus] = useState<string>('');
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const [guestInfo, setGuestInfo] = useState({ name: '', additionalInfo: '' });
  const [error, setError] = useState<string | null>(null);
  const [showNewStudentForm, setShowNewStudentForm] = useState(false);
  const [newStudentInfo, setNewStudentInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    classification: 'Freshman',
    studentId: ''
  });

  const canManageCheckins = userProfile?.role === 'Board Member' || userProfile?.role === 'President';

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
        const eventsRef = collection(db, 'checkin_events');
        const querySnapshot = await getDocs(eventsRef);
        const fetchedEvents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CheckInEvent[];

        setEvents(fetchedEvents);
      }
      setLoading(false);
    };

    fetchUserProfileAndEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageCheckins) return;

    try {
      const eventData = {
        name: newEventName,
        date: Timestamp.now(),
        isActive: true,
        checkedInUsers: []
      };

      const docRef = await addDoc(collection(db, 'checkin_events'), eventData);
      const newEvent = { id: docRef.id, ...eventData };
      setEvents(prev => [...prev, newEvent]);
      setIsCreatingEvent(false);
      setNewEventName('');
      setActiveEvent(newEvent);
    } catch (error) {
      console.error('Error creating event:', error);
      setError('Failed to create event');
    }
  };

  const handleCheckIn = async () => {
    if (!activeEvent || !cwidInput) return;

    try {
        // Extract CWID from card swipe input
        const matches = cwidInput.match(/;(\d{8})/);
        const processedCwid = matches ? matches[1] : cwidInput.slice(0, 8);
        
        // Search for user in database
        const usersRef = collection(db, 'users');
        // First try to find by studentId
        let q = query(usersRef, where('studentId', '==', processedCwid));
        let querySnapshot = await getDocs(q);

        // If not found by studentId, try to find by uid (for backward compatibility)
        if (querySnapshot.empty) {
            q = query(usersRef, where('uid', '==', processedCwid));
            querySnapshot = await getDocs(q);
        }

        if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data() as UserProfile;
            
            // Check if user is already checked in
            const isAlreadyCheckedIn = activeEvent.checkedInUsers.some(
                user => (user.cwid === processedCwid) || (user.userId === userData.uid)
            );

            if (isAlreadyCheckedIn) {
                setError('This user is already checked in for this event');
                return;
            }

            // Consider all roles except 'Not a Member' as valid members
            const validRoles = ['Member', 'Board Member', 'President'];
            const isMember = validRoles.includes(userData.role);

            // Create check-in record with required fields and optional fields properly handled
            const checkInRecord: CheckInRecord = {
                userId: userData.uid || '',  // Ensure userId is never undefined
                cwid: processedCwid,
                name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
                email: userData.email || '',  // Ensure email is never undefined
                timestamp: Timestamp.now(),
                isGuest: false,
                isMember: isMember
            };

            // Create a clean version of the event for update
            const updatedEvent = {
                id: activeEvent.id,
                name: activeEvent.name,
                date: activeEvent.date,
                isActive: activeEvent.isActive,
                checkedInUsers: [...activeEvent.checkedInUsers, checkInRecord]
            };

            await updateEvent(updatedEvent);
            setError(null); // Clear any existing errors
            setCheckInStatus(`Checked in: ${checkInRecord.name} (${userData.role})`);
            setCwidInput('');
        } else {
            // Show new student registration form
            setNewStudentInfo(prev => ({ ...prev, studentId: processedCwid }));
            setShowNewStudentForm(true);
            setCwidInput('');
        }
    } catch (error) {
        console.error('Error checking in:', error);
        if (error instanceof Error) {
            setError(`Failed to check in: ${error.message}`);
        } else {
            setError('Failed to check in. Please try again.');
        }
    }
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent) return;

    try {
      const guestRecord: CheckInRecord = {
        name: guestInfo.name,
        timestamp: Timestamp.now(),
        isGuest: true,
        isMember: false,
        additionalInfo: guestInfo.additionalInfo || undefined
      };

      const updatedEvent = {
        ...activeEvent,
        checkedInUsers: [...activeEvent.checkedInUsers, guestRecord]
      };

      await updateEvent(updatedEvent);
      setIsAddingGuest(false);
      setGuestInfo({ name: '', additionalInfo: '' });
      setCheckInStatus(`Guest added: ${guestInfo.name}`);
    } catch (error) {
      console.error('Error adding guest:', error);
      setError('Failed to add guest');
    }
  };

  const handleAddNewStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent) return;

    try {
      // Create user document in Firestore
      const userData = {
        firstName: newStudentInfo.firstName,
        lastName: newStudentInfo.lastName,
        email: newStudentInfo.email,
        classification: newStudentInfo.classification,
        role: 'Member',
        studentId: newStudentInfo.studentId,
        createdAt: Timestamp.now()
      };

      const userRef = await addDoc(collection(db, 'users'), userData);

      // Create check-in record
      const checkInRecord: CheckInRecord = {
        userId: userRef.id,
        cwid: newStudentInfo.studentId,
        name: `${newStudentInfo.firstName} ${newStudentInfo.lastName}`,
        email: newStudentInfo.email,
        timestamp: Timestamp.now(),
        isGuest: false,
        isMember: true
      };

      const updatedEvent = {
        ...activeEvent,
        checkedInUsers: [...activeEvent.checkedInUsers, checkInRecord]
      };

      await updateEvent(updatedEvent);
      setShowNewStudentForm(false);
      setCheckInStatus(`Added and checked in new member: ${newStudentInfo.firstName} ${newStudentInfo.lastName}`);
      
      // Reset form
      setNewStudentInfo({
        firstName: '',
        lastName: '',
        email: '',
        classification: 'Freshman',
        studentId: ''
      });
    } catch (error) {
      console.error('Error adding new student:', error);
      setError('Failed to add new student');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!canManageCheckins) return;
    
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'checkin_events', eventId));
      setEvents(prev => prev.filter(event => event.id !== eventId));
      setActiveEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event');
    }
  };

  const handleDeleteCheckIn = async (checkInIndex: number) => {
    if (!activeEvent || !canManageCheckins) return;

    try {
      const updatedCheckedInUsers = [...activeEvent.checkedInUsers];
      updatedCheckedInUsers.splice(checkInIndex, 1);

      const updatedEvent = {
        ...activeEvent,
        checkedInUsers: updatedCheckedInUsers
      };

      await updateEvent(updatedEvent);
    } catch (error) {
      console.error('Error deleting check-in:', error);
      setError('Failed to delete check-in');
    }
  };

  const updateEvent = async (updatedEvent: CheckInEvent) => {
    try {
      const eventData = {
        name: updatedEvent.name,
        date: updatedEvent.date,
        isActive: updatedEvent.isActive,
        checkedInUsers: updatedEvent.checkedInUsers
      };
      await updateDoc(doc(db, 'checkin_events', updatedEvent.id), eventData);
      setEvents(prev => prev.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      ));
      setActiveEvent(updatedEvent);
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };

  const generateReport = () => {
    if (!activeEvent) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Check-in Report: ${activeEvent.name}`, 14, 15);
    doc.setFontSize(12);
    doc.text(`Date: ${activeEvent.date.toDate().toLocaleDateString()}`, 14, 25);

    // Calculate totals
    const totalCheckins = activeEvent.checkedInUsers.length;
    const totalMembers = activeEvent.checkedInUsers.filter(user => user.isMember).length;
    const totalGuests = activeEvent.checkedInUsers.filter(user => user.isGuest).length;
    const totalNonMembers = totalCheckins - totalMembers - totalGuests;

    // Add summary section
    doc.text('Summary:', 14, 35);
    doc.text(`Total Check-ins: ${totalCheckins}`, 14, 45);
    doc.text(`Total Members: ${totalMembers}`, 14, 55);
    doc.text(`Total Non-Members: ${totalNonMembers}`, 14, 65);
    doc.text(`Total Guests: ${totalGuests}`, 14, 75);

    const tableData = activeEvent.checkedInUsers.map(user => [
      user.name,
      user.cwid || 'N/A',
      user.isGuest ? 'Guest' : (user.isMember ? 'Member' : 'Non-Member'),
      user.timestamp.toDate().toLocaleTimeString(),
      user.email || 'N/A'
    ]);

    (doc as jsPDF).autoTable({
      startY: 85,
      head: [['Name', 'CWID', 'Type', 'Time', 'Email']],
      body: tableData,
    });

    doc.save(`checkin-report-${activeEvent.name}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-crimson-600"></div>
      </div>
    );
  }

  if (!canManageCheckins) {
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
                Only board members and presidents can access the check-in system.
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
            <h1 className="text-2xl font-bold text-gray-900">Check-in System</h1>
            {!activeEvent && (
              <button
                onClick={() => setIsCreatingEvent(true)}
                className="flex items-center gap-2 px-4 py-2 bg-crimson-600 text-white rounded-md hover:bg-crimson-700"
              >
                <IconPlus className="h-5 w-5" />
                Create Event
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Event Selection or Creation */}
          {!activeEvent && !isCreatingEvent && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Select Event</h2>
              {events.map(event => (
                <div
                  key={event.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 flex justify-between items-center"
                >
                  <button
                    onClick={() => setActiveEvent(event)}
                    className="flex-1 text-left"
                  >
                    <div className="font-medium">{event.name}</div>
                    <div className="text-sm text-gray-500">
                      {event.date.toDate().toLocaleDateString()}
                    </div>
                  </button>
                  {canManageCheckins && (
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="ml-4 p-2 text-red-600 hover:text-red-700 rounded-full hover:bg-red-50"
                      title="Delete event"
                    >
                      <IconTrash className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Create Event Form */}
          {isCreatingEvent && (
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Event Name</label>
                <input
                  type="text"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-crimson-600 text-white rounded-md hover:bg-crimson-700"
                >
                  Create Event
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingEvent(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Active Event Check-in Interface */}
          {activeEvent && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{activeEvent.name}</h2>
                  <p className="text-gray-500">
                    {activeEvent.date.toDate().toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={generateReport}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <IconDownload className="h-5 w-5" />
                    Download Report
                  </button>
                  <button
                    onClick={() => setIsAddingGuest(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <IconUserPlus className="h-5 w-5" />
                    Add Guest
                  </button>
                  {canManageCheckins && (
                    <button
                      onClick={() => handleDeleteEvent(activeEvent.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      <IconTrash className="h-5 w-5" />
                      Delete Event
                    </button>
                  )}
                </div>
              </div>

              {/* Check-in Form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cwidInput}
                  onChange={(e) => setCwidInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCheckIn();
                    }
                  }}
                  placeholder="Enter CWID"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                  maxLength={12}
                />
                <button
                  onClick={handleCheckIn}
                  className="flex items-center gap-2 px-4 py-2 bg-crimson-600 text-white rounded-md hover:bg-crimson-700"
                >
                  <IconSearch className="h-5 w-5" />
                  Check In
                </button>
              </div>

              {checkInStatus && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  {checkInStatus}
                </div>
              )}

              {/* Checked-in Users List */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Checked-in Users</h3>
                <div className="space-y-2">
                  {activeEvent.checkedInUsers.map((user, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">
                          {user.isGuest ? 'Guest' : `CWID: ${user.cwid}`}
                        </div>
                        <div className="text-sm">
                          {user.isGuest ? (
                            <span className="text-purple-600">Guest</span>
                          ) : user.isMember ? (
                            <span className="text-green-600">Member</span>
                          ) : (
                            <span className="text-gray-600">Non-Member</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500">
                          {user.timestamp.toDate().toLocaleTimeString()}
                        </div>
                        {canManageCheckins && (
                          <button
                            onClick={() => handleDeleteCheckIn(index)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete check-in"
                          >
                            <IconTrash className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Add Guest Modal */}
          {isAddingGuest && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-semibold mb-4">Add Guest</h2>
                <form onSubmit={handleAddGuest} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Guest Name</label>
                    <input
                      type="text"
                      value={guestInfo.name}
                      onChange={(e) => setGuestInfo(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Additional Information (Optional)</label>
                    <textarea
                      value={guestInfo.additionalInfo}
                      onChange={(e) => setGuestInfo(prev => ({ ...prev, additionalInfo: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      rows={3}
                      placeholder="Enter any additional information about the guest..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-crimson-600 text-white rounded-md hover:bg-crimson-700"
                    >
                      Add Guest
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingGuest(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* New Student Registration Modal */}
          {showNewStudentForm && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-semibold mb-4">Add New Student</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Student not found in database. Would you like to add them as a new member?
                </p>
                <form onSubmit={handleAddNewStudent} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <input
                        type="text"
                        value={newStudentInfo.firstName}
                        onChange={(e) => setNewStudentInfo(prev => ({ ...prev, firstName: e.target.value }))}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        value={newStudentInfo.lastName}
                        onChange={(e) => setNewStudentInfo(prev => ({ ...prev, lastName: e.target.value }))}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={newStudentInfo.email}
                      onChange={(e) => setNewStudentInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      required
                      placeholder="@warhawks.ulm.edu"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Classification</label>
                    <select
                      value={newStudentInfo.classification}
                      onChange={(e) => setNewStudentInfo(prev => ({ ...prev, classification: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      required
                    >
                      <option value="Freshman">Freshman</option>
                      <option value="Sophomore">Sophomore</option>
                      <option value="Junior">Junior</option>
                      <option value="Senior">Senior</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Student ID (CWID)</label>
                    <input
                      type="text"
                      value={newStudentInfo.studentId}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50"
                      disabled
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-crimson-600 text-white rounded-md hover:bg-crimson-700"
                    >
                      Add & Check In
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewStudentForm(false)}
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