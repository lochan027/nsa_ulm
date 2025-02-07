'use client';

import { useState } from 'react';
import Image from 'next/image';

const boardMembers = [
  '/images/Boardmember/president.jpeg',
  '/images/Boardmember/1.png',
  '/images/Boardmember/2.png',
  '/images/Boardmember/4.png?v=2',
  '/images/Boardmember/6.png',
  '/images/Boardmember/7.png',
  '/images/Boardmember/8.png',
  '/images/Boardmember/9.png',
  '/images/Boardmember/11.png',
  '/images/Boardmember/12.png'
];

export default function BoardMembers() {
  const [startIndex, setStartIndex] = useState(0);
  const cardsToShow = 3; // Number of cards to show at once

  const nextSlide = () => {
    setStartIndex((prevIndex) => 
      prevIndex + cardsToShow >= boardMembers.length ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setStartIndex((prevIndex) => 
      prevIndex === 0 ? boardMembers.length - cardsToShow : prevIndex - 1
    );
  };

  // Get the current visible cards
  const visibleCards = () => {
    const cards = [];
    for (let i = 0; i < cardsToShow; i++) {
      const index = (startIndex + i) % boardMembers.length;
      cards.push(boardMembers[index]);
    }
    return cards;
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Current Board Members
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Meet our dedicated team leading NSA ULM
          </p>
        </div>

        <div className="relative px-12">
          {/* Cards container */}
          <div className="flex justify-center gap-8">
            {visibleCards().map((image, index) => (
              <div
                key={`${image}-${index}`}
                className="w-[300px] h-[400px] bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-500 hover:scale-105"
              >
                <div className="relative w-full h-full">
                  <Image
                    src={image}
                    alt="Board Member"
                    fill
                    className="object-cover"
                    sizes="(max-width: 300px) 100vw, 300px"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Navigation arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-100 p-3 rounded-full shadow-lg z-10 transition-all hover:scale-110"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-crimson-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-100 p-3 rounded-full shadow-lg z-10 transition-all hover:scale-110"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-crimson-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
} 