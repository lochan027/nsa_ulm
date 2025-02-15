'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const boardMembers = [
  '/images/Boardmember/president.jpeg',
  '/images/Boardmember/2.png',
  '/images/Boardmember/1.png',
  '/images/Boardmember/4.png?v=2',
  '/images/Boardmember/13.png',
  '/images/Boardmember/6.png',
  '/images/Boardmember/7.png',
  '/images/Boardmember/8.png',
  '/images/Boardmember/9.png',
  '/images/Boardmember/14.png',
  '/images/Boardmember/11.png',
  '/images/Boardmember/12.png'
];

export default function BoardMembers() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const handleNext = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentIndex((prev) => (prev + 1) % boardMembers.length);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const handlePrev = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentIndex((prev) => (prev - 1 + boardMembers.length) % boardMembers.length);
      setTimeout(() => setIsAnimating(false), 500);
    }
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

        <div className="relative mx-auto max-w-[1200px] h-[600px] overflow-hidden">
          <div className="absolute w-full h-full flex items-center justify-center">
            {boardMembers.map((image, index) => {
              const position = (index - currentIndex + boardMembers.length) % boardMembers.length;
              const isActive = position === 0;
              const isPrev = position === boardMembers.length - 1;
              const isNext = position === 1;
              
              let translateX = '100%';
              let translateZ = '-500px';
              let opacity = '0';
              let scale = '0.8';
              let zIndex = 0;

              if (isActive) {
                translateX = '0';
                translateZ = '0';
                opacity = '1';
                scale = '1';
                zIndex = 30;
              } else if (isPrev) {
                translateX = '-100%';
                translateZ = '-250px';
                opacity = '0.7';
                scale = '0.9';
                zIndex = 20;
              } else if (isNext) {
                translateX = '100%';
                translateZ = '-250px';
                opacity = '0.7';
                scale = '0.9';
                zIndex = 20;
              }

              return (
                <div
                  key={image}
                  className="absolute w-[400px] h-[500px] transition-all duration-500 ease-in-out"
                  style={{
                    transform: `translateX(${translateX}) translateZ(${translateZ}) scale(${scale})`,
                    opacity,
                    zIndex,
                  }}
                >
                  <div className="relative w-full h-full rounded-xl shadow-xl overflow-hidden">
                    <Image
                      src={image}
                      alt="Board Member"
                      fill
                      className="object-cover"
                      sizes="(max-width: 400px) 100vw, 400px"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation buttons */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg z-40 transition-all hover:scale-110"
            disabled={isAnimating}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-crimson-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg z-40 transition-all hover:scale-110"
            disabled={isAnimating}
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