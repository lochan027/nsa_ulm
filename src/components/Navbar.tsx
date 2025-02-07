'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full bg-white/95 backdrop-blur-md z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/txtnsalogo.png"
                alt="NSA ULM"
                width={100}
                height={60}
                className="h-12 w-auto"
              />
            </Link>
          </div>

          {/* Center Flag */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
            <Image
              src="/images/nepaliflagwave.png"
              alt="Nepal Flag"
              width={50}
              height={50}
              className="h-10 w-auto"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link href="/" className="text-gray-900 hover:text-crimson-600 px-3 py-2 rounded-md text-sm font-medium">
                Home
              </Link>
              <Link href="/#about" className="text-gray-900 hover:text-crimson-600 px-3 py-2 rounded-md text-sm font-medium">
                About
              </Link>
              <Link href="/#contact" className="text-gray-900 hover:text-crimson-600 px-3 py-2 rounded-md text-sm font-medium">
                Contact
              </Link>
              <Link href="/login" className="bg-crimson-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-crimson-700">
                Login
              </Link>
              <Link href="/signup" className="bg-gray-100 text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200">
                Sign Up
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-crimson-500"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" className="block text-gray-900 hover:text-crimson-600 px-3 py-2 rounded-md text-base font-medium">
              Home
            </Link>
            <Link href="/#about" className="block text-gray-900 hover:text-crimson-600 px-3 py-2 rounded-md text-base font-medium">
              About
            </Link>
            <Link href="/#contact" className="block text-gray-900 hover:text-crimson-600 px-3 py-2 rounded-md text-base font-medium">
              Contact
            </Link>
            <Link href="/login" className="block bg-crimson-600 text-white px-4 py-2 rounded-md text-base font-medium hover:bg-crimson-700">
              Login
            </Link>
            <Link href="/signup" className="block bg-gray-100 text-gray-800 px-4 py-2 rounded-md text-base font-medium hover:bg-gray-200">
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
} 