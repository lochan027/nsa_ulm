'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { FirebaseError } from 'firebase/app';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const router = useRouter();

  const handlePasswordReset = async () => {
    if (!identifier) {
      setError('Please enter your email or username first');
      return;
    }

    setIsResettingPassword(true);
    setError('');
    setSuccessMessage('');

    try {
      let emailToUse = identifier;

      // If the identifier doesn't look like an email, try to find the email from username
      if (!identifier.includes('@')) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', identifier));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError('No user found with this username');
          setIsResettingPassword(false);
          return;
        }

        emailToUse = querySnapshot.docs[0].data().email;
      }

      await sendPasswordResetEmail(auth, emailToUse);
      setSuccessMessage('Password reset email sent! Please check your inbox.');
    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/invalid-email':
            setError('Invalid email format');
            break;
          case 'auth/user-not-found':
            setError('No account found with this email');
            break;
          default:
            setError('Failed to send reset email. Please try again.');
        }
      } else {
        setError('An unexpected error occurred');
      }
    }
    setIsResettingPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      // Set persistence based on remember me checkbox
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      let emailToUse = identifier;

      // If the identifier doesn't look like an email, assume it's a username
      if (!identifier.includes('@')) {
        // Query Firestore to find the email associated with the username
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', identifier));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError('No user found with this username');
          setIsSubmitting(false);
          return;
        }

        emailToUse = querySnapshot.docs[0].data().email;
      }

      // Attempt to sign in with the email
      await signInWithEmailAndPassword(auth, emailToUse, password);
      router.push('/dashboard');
    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/invalid-email':
            setError('Invalid email format');
            break;
          case 'auth/user-not-found':
            setError('No account found with these credentials');
            break;
          case 'auth/wrong-password':
            setError('Incorrect password');
            break;
          default:
            setError('Failed to login. Please check your credentials.');
        }
      } else {
        setError('An unexpected error occurred');
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
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-200">
          Or{' '}
          <Link href="/signup" className="font-medium text-crimson-300 hover:text-crimson-200">
            create a new account
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
            {successMessage && (
              <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{successMessage}</span>
              </div>
            )}
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-900">
                Email or Username
              </label>
              <div className="mt-1">
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="email"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-crimson-500 focus:border-crimson-500 sm:text-sm"
                  placeholder="Enter your email or username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-crimson-500 focus:border-crimson-500 sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-crimson-600 focus:ring-crimson-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={isResettingPassword}
                className="text-sm font-medium text-crimson-600 hover:text-crimson-500 disabled:opacity-50"
              >
                {isResettingPassword ? 'Sending...' : 'Forgot your password?'}
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-crimson-600 hover:bg-crimson-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-crimson-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 