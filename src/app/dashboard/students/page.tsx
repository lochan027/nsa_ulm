'use client';

import { useState, useEffect, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, getDocs, doc, updateDoc, addDoc, where, deleteDoc } from 'firebase/firestore';
import type { UserProfile, UserRole, UserClassification } from '@/lib/firebase';
import { Search, Edit2, UserPlus, Upload } from 'lucide-react';

interface StudentFilters {
  role: UserRole | 'all';
  classification: string;
  searchTerm: string;
  searchType: 'basic' | 'cwid';
}

export default function StudentDatabasePage() {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<UserProfile[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<StudentFilters>({
    role: 'all',
    classification: 'all',
    searchTerm: '',
    searchType: 'basic',
  });
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    studentId: '',
    classification: 'Freshman' as UserClassification,
    role: 'Not a Member' as UserRole,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const canEditStudents = userProfile?.role === 'Board Member' || userProfile?.role === 'President';

  useEffect(() => {
    const fetchUserProfileAndStudents = async () => {
      if (auth.currentUser) {
        // Fetch current user's profile
        const userDocSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', auth.currentUser.uid)));
        if (!userDocSnap.empty) {
          setUserProfile(userDocSnap.docs[0].data() as UserProfile);
        }

        // Fetch all students
        const studentsQuery = query(collection(db, 'users'));
        const querySnapshot = await getDocs(studentsQuery);
        const fetchedStudents = querySnapshot.docs.map(doc => ({
          ...(doc.data() as UserProfile),
          uid: doc.id
        }));
        setStudents(fetchedStudents);
        setFilteredStudents(fetchedStudents);
      }
      setLoading(false);
    };

    fetchUserProfileAndStudents();
  }, []);

  useEffect(() => {
    // Apply filters
    let result = [...students];

    if (filters.role !== 'all') {
      result = result.filter(student => student.role === filters.role);
    }

    if (filters.classification !== 'all') {
      result = result.filter(student => student.classification === filters.classification);
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      
      if (filters.searchType === 'cwid') {
        // For CWID search, only use the first 8 digits for comparison
        const searchCWID = searchLower.slice(0, 8);
        result = result.filter(student => 
          student.studentId?.startsWith(searchCWID)
        );
      } else {
        // Basic search remains the same
        result = result.filter(student => 
          student.firstName.toLowerCase().includes(searchLower) ||
          student.lastName.toLowerCase().includes(searchLower) ||
          student.email.toLowerCase().includes(searchLower) ||
          student.studentId?.includes(searchLower)
        );
      }
    }

    setFilteredStudents(result);
  }, [filters, students]);

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditStudents || !selectedStudent) return;

    try {
      setError(null);

      // Check if board member is trying to edit another board member's profile
      if (userProfile?.role === 'Board Member' && 
          (selectedStudent.role === 'Board Member' || selectedStudent.role === 'President')) {
        setError('Board members cannot edit other board members\' or president\'s profiles');
        return;
      }

      // Validate student ID if provided
      if (selectedStudent.studentId && !/^\d{8}$/.test(selectedStudent.studentId)) {
        setError('Student ID must be exactly 8 digits');
        return;
      }

      // Format names
      const formattedStudent = {
        ...selectedStudent,
        firstName: selectedStudent.firstName.charAt(0).toUpperCase() + selectedStudent.firstName.slice(1).toLowerCase(),
        lastName: selectedStudent.lastName.charAt(0).toUpperCase() + selectedStudent.lastName.slice(1).toLowerCase(),
      };

      // Find all user documents with matching email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', formattedStudent.email));
      const querySnapshot = await getDocs(q);

      // Update all matching documents (there might be multiple if the user exists in both auth and database)
      const updatePromises = querySnapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          firstName: formattedStudent.firstName,
          lastName: formattedStudent.lastName,
          studentId: formattedStudent.studentId,
          email: formattedStudent.email,
          classification: formattedStudent.classification,
          role: formattedStudent.role,
        })
      );

      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      setStudents(prevStudents =>
        prevStudents.map(student =>
          student.uid === selectedStudent.uid ? formattedStudent : student
        )
      );

      setSelectedStudent(null);
      setIsEditing(false);
      setError(null);

      // Show success message
      setError(`Successfully updated ${formattedStudent.firstName}'s profile`);
      setTimeout(() => setError(null), 3000); // Clear success message after 3 seconds
    } catch (error) {
      console.error('Error updating student:', error);
      setError('Failed to update student details');
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditStudents) return;

    // Validate student ID format (8 digits)
    if (!/^\d{8}$/.test(newStudent.studentId)) {
      setError('Student ID must be exactly 8 digits');
      return;
    }

    try {
      setError(null);
      const studentData = {
        ...newStudent,
        email: `${newStudent.studentId}@warhawks.ulm.edu`,
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'users'), studentData);
      const addedStudent = {
        ...studentData,
        uid: docRef.id,
      } as UserProfile;

      setStudents(prev => [...prev, addedStudent]);
      setIsAddingStudent(false);
      setNewStudent({
        firstName: '',
        lastName: '',
        studentId: '',
        classification: 'Freshman',
        role: 'Not a Member',
      });
    } catch (error) {
      console.error('Error adding student:', error);
      setError('Failed to add student');
    }
  };

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const text = await file.text();
      const rows = text.split('\n');
      
      // Skip the header row and filter out empty rows or rows with just commas
      const studentData = rows
        .slice(1)
        .filter(row => {
          const nonEmptyFields = row.split(',').map(field => field.trim()).filter(Boolean);
          return nonEmptyFields.length > 0;
        })
        .map(row => {
          // Split by commas and trim each field
          const fields = row.split(',').map(field => field.trim());
          
          // Fields are: S/N, Name, CWID, Email, Added by
          const [, fullName, cwid = '', email = ''] = fields;
          
          if (!fullName) {
            throw new Error(`Missing name in row: ${row}`);
          }

          // Split the full name into first and last name
          const nameParts = fullName.trim().split(' ').filter(part => part.length > 0);
          if (nameParts.length < 2) {
            throw new Error(`Invalid name format for: ${fullName}. Must include both first and last name.`);
          }

          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(' ');

          // Format names (capitalize first letter, rest lowercase)
          const formattedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
          const formattedLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();

          // Only validate CWID if it's provided
          if (cwid && !/^\d{8}$/.test(cwid)) {
            throw new Error(`Invalid CWID format for student: ${formattedFirstName} ${formattedLastName}`);
          }

          return {
            firstName: formattedFirstName,
            lastName: formattedLastName,
            studentId: cwid,
            email: email,
            classification: 'Freshman' as UserClassification,
            role: 'Member' as UserRole,
            createdAt: new Date(),
          };
        });

      let importedCount = 0;
      let skippedCount = 0;

      // Add students to database, skipping existing ones
      for (const student of studentData) {
        // Check if student with same name already exists
        const existingStudent = students.find(
          s => s.firstName.toLowerCase() === student.firstName.toLowerCase() && 
               s.lastName.toLowerCase() === student.lastName.toLowerCase()
        );

        if (existingStudent) {
          skippedCount++;
          continue; // Skip this student
        }

        const docRef = await addDoc(collection(db, 'users'), student);
        setStudents(prev => [...prev, { ...student, uid: docRef.id } as UserProfile]);
        importedCount++;
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setError(`Successfully imported ${importedCount} students${skippedCount > 0 ? ` (${skippedCount} skipped as duplicates)` : ''}`);
    } catch (error) {
      console.error('Error processing CSV:', error);
      setError(error instanceof Error ? error.message : 'Failed to process CSV file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredStudents.map(student => student.uid);
      setSelectedStudents(new Set(allIds));
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (!canEditStudents || selectedStudents.size === 0) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedStudents.size} student${selectedStudents.size > 1 ? 's' : ''}?`
    );

    if (!confirmDelete) return;

    try {
      setError(null);
      const deletePromises = Array.from(selectedStudents).map(studentId =>
        deleteDoc(doc(db, 'users', studentId))
      );
      await Promise.all(deletePromises);

      setStudents(prevStudents =>
        prevStudents.filter(student => !selectedStudents.has(student.uid))
      );
      setSelectedStudents(new Set());
      setError(`Successfully deleted ${selectedStudents.size} student${selectedStudents.size > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Error deleting students:', error);
      setError('Failed to delete selected students');
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
            <h1 className="text-2xl font-bold text-gray-900">Student Database</h1>
            {canEditStudents && (
              <div className="flex gap-2">
                {selectedStudents.size > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    <span>Delete Selected ({selectedStudents.size})</span>
                  </button>
                )}
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="hidden"
                  ref={fileInputRef}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}
                  {isProcessing ? 'Processing...' : 'Import CSV'}
                </button>
                <button
                  onClick={() => setIsAddingStudent(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-crimson-600 text-white rounded-md hover:bg-crimson-700"
                >
                  <UserPlus className="h-5 w-5" />
                  Add Student
                </button>
              </div>
            )}
          </div>

          {/* Filters and Search */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={filters.role}
                onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value as UserRole | 'all' }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="all">All Roles</option>
                <option value="Not a Member">Not a Member</option>
                <option value="Member">Member</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Classification</label>
              <select
                value={filters.classification}
                onChange={(e) => setFilters(prev => ({ ...prev, classification: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="all">All Classifications</option>
                <option value="Freshman">Freshman</option>
                <option value="Sophomore">Sophomore</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Type</label>
              <select
                value={filters.searchType}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  searchType: e.target.value as 'basic' | 'cwid',
                  searchTerm: '' // Clear search term when changing type
                }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="basic">Basic Search</option>
                <option value="cwid">CWID Search</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {filters.searchType === 'cwid' ? 'Search by CWID (searches first 8 digits)' : 'Search'}
              </label>
              <div className="relative">
                <input
                  type={filters.searchType === 'cwid' ? 'number' : 'text'}
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    searchTerm: filters.searchType === 'cwid' 
                      ? e.target.value.slice(0, 12) // Allow up to 12 digits input
                      : e.target.value 
                  }))}
                  placeholder={filters.searchType === 'cwid' 
                    ? "Enter CWID (up to 12 digits)..." 
                    : "Search by name, ID, or email..."
                  }
                  className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2"
                />
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                {filters.searchType === 'cwid' && filters.searchTerm && (
                  <div className="absolute right-3 top-2.5 text-xs text-gray-500">
                    Searching: {filters.searchTerm.slice(0, 8)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {canEditStudents && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-crimson-600 focus:ring-crimson-500"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classification</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  {canEditStudents && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.uid}>
                    {canEditStudents && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedStudents.has(student.uid)}
                          onChange={(e) => handleSelectStudent(student.uid, e.target.checked)}
                          className="rounded border-gray-300 text-crimson-600 focus:ring-crimson-500"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{student.studentId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{student.classification}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        student.role === 'Member' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {student.role}
                      </span>
                    </td>
                    {canEditStudents && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setIsEditing(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Edit Role Modal */}
          {isEditing && selectedStudent && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-semibold mb-4">Edit Student Details</h2>
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}
                <form onSubmit={handleUpdateStudent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      value={selectedStudent.firstName}
                      onChange={(e) => setSelectedStudent({ ...selectedStudent, firstName: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      value={selectedStudent.lastName}
                      onChange={(e) => setSelectedStudent({ ...selectedStudent, lastName: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Student ID (CWID)</label>
                    <input
                      type="text"
                      value={selectedStudent.studentId || ''}
                      onChange={(e) => setSelectedStudent({ ...selectedStudent, studentId: e.target.value })}
                      pattern="[0-9]{8}"
                      maxLength={8}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={selectedStudent.email}
                      onChange={(e) => setSelectedStudent({ ...selectedStudent, email: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Classification</label>
                    <select
                      value={selectedStudent.classification}
                      onChange={(e) => setSelectedStudent({ ...selectedStudent, classification: e.target.value as UserClassification })}
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
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                      value={selectedStudent.role}
                      onChange={(e) => setSelectedStudent({ ...selectedStudent, role: e.target.value as UserRole })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      required
                    >
                      <option value="Not a Member">Not a Member</option>
                      <option value="Member">Member</option>
                      {userProfile?.role === 'President' && (
                        <>
                          <option value="Board Member">Board Member</option>
                          <option value="President">President</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudent(null);
                        setIsEditing(false);
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

          {/* Add Student Modal */}
          {isAddingStudent && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-semibold mb-4">Add New Student</h2>
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}
                <form onSubmit={handleAddStudent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      value={newStudent.firstName}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, firstName: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      value={newStudent.lastName}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, lastName: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Student ID (8 digits)</label>
                    <input
                      type="text"
                      value={newStudent.studentId}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, studentId: e.target.value }))}
                      pattern="[0-9]{8}"
                      maxLength={8}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Classification</label>
                    <select
                      value={newStudent.classification}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, classification: e.target.value as UserClassification }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      required
                    >
                      <option value="Freshman">Freshman</option>
                      <option value="Sophomore">Sophomore</option>
                      <option value="Junior">Junior</option>
                      <option value="Senior">Senior</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-crimson-600 text-white rounded-md hover:bg-crimson-700"
                    >
                      Add Student
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingStudent(false);
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