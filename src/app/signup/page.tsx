'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { FirebaseError } from 'firebase/app';
import type { UserClassification, UserRole } from '@/lib/firebase';
import ReCAPTCHA from 'react-google-recaptcha';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    emailPrefix: '',
    password: '',
    confirmPassword: '',
    classification: 'Freshman' as UserClassification,
    role: 'Not a Member' as UserRole
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const router = useRouter();

  const getFullEmail = () => `${formData.emailPrefix}@warhawks.ulm.edu`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validation checks
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    if (!captchaToken) {
      setError('Please complete the CAPTCHA verification');
      setIsSubmitting(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsSubmitting(false);
      return;
    }

    if (!formData.emailPrefix.trim()) {
      setError('Email prefix is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required');
      setIsSubmitting(false);
      return;
    }

    const fullEmail = getFullEmail();

    try {
      // First, check if a student record exists
      const studentsRef = collection(db, 'users');
      const q = query(studentsRef, where('email', '==', fullEmail));
      const studentSnapshot = await getDocs(q);
      
      let existingRole: UserRole = 'Not a Member';
      let existingClassification: UserClassification = formData.classification;
      let studentId = '';

      // If student record exists, use their role and classification
      if (!studentSnapshot.empty) {
        const studentData = studentSnapshot.docs[0].data();
        existingRole = studentData.role as UserRole;
        existingClassification = studentData.classification as UserClassification;
        studentId = studentData.studentId || '';
      }

      // Create the authentication user
      const userCredential = await createUserWithEmailAndPassword(auth, fullEmail, formData.password);
      const user = userCredential.user;

      // Format names with proper capitalization
      const formattedFirstName = formData.firstName.charAt(0).toUpperCase() + formData.firstName.slice(1).toLowerCase();
      const formattedLastName = formData.lastName.charAt(0).toUpperCase() + formData.lastName.slice(1).toLowerCase();

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: fullEmail,
        firstName: formattedFirstName,
        lastName: formattedLastName,
        classification: existingClassification,
        role: existingRole,
        studentId: studentId,
        createdAt: new Date(),
      });

      router.push('/dashboard');
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/email-already-in-use':
            setError('This email is already registered');
            break;
          case 'auth/invalid-email':
            setError('Invalid email address');
            break;
          case 'auth/operation-not-allowed':
            setError('Email/password accounts are not enabled');
            break;
          case 'auth/weak-password':
            setError('Password is too weak');
            break;
          default:
            setError(err.message);
        }
      } else {
        setError('An error occurred during signup');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col py-12 sm:px-6 lg:px-8 relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/images/everestbackground.jpg)' }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <Link
        href="/"
        className="fixed top-4 left-4 flex items-center text-white hover:text-crimson-300 transition-colors z-20"
      >
        <ArrowLeft className="h-5 w-5 mr-1" />
        <span>Home</span>
      </Link>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <h2 className="text-center text-3xl font-extrabold text-white">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-200">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-crimson-300 hover:text-crimson-200">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/90 backdrop-blur-sm py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex justify-center mb-8">
            <Image
              src="/images/nsalogo.png"
              alt="NSA ULM Logo"
              width={100}
              height={100}
              className="mb-2"
            />
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-crimson-500 focus:border-crimson-500 sm:text-sm"
                  placeholder="John"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-crimson-500 focus:border-crimson-500 sm:text-sm"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                ULM Email
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  id="emailPrefix"
                  name="emailPrefix"
                  type="text"
                  required
                  value={formData.emailPrefix}
                  onChange={(e) => setFormData(prev => ({ ...prev, emailPrefix: e.target.value }))}
                  className="appearance-none flex-1 block w-full px-3 py-2 border border-r-0 border-gray-300 rounded-l-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-crimson-500 focus:border-crimson-500 sm:text-sm"
                  placeholder="your.name"
                />
                <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm rounded-r-md">
                  @warhawks.ulm.edu
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="classification" className="block text-sm font-medium text-gray-700">
                Classification
              </label>
              <select
                id="classification"
                name="classification"
                required
                value={formData.classification}
                onChange={(e) => setFormData(prev => ({ ...prev, classification: e.target.value as UserClassification }))}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-crimson-500 focus:border-crimson-500 sm:text-sm"
              >
                <option value="Freshman">Freshman</option>
                <option value="Sophomore">Sophomore</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-crimson-500 focus:border-crimson-500 sm:text-sm"
                placeholder="Choose a strong password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-crimson-500 focus:border-crimson-500 sm:text-sm"
                placeholder="Confirm your password"
              />
            </div>

            <div className="flex justify-center">
              <ReCAPTCHA
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
                onChange={(token: string | null) => setCaptchaToken(token)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-crimson-600 hover:bg-crimson-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-crimson-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 