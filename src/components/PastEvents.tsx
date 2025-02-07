import Image from 'next/image';

const events = [
  {
    id: 1,
    title: 'Dashain Celebration 2023',
    date: 'October 15, 2023',
    description: 'Annual Dashain celebration with traditional Nepalese food, cultural performances, and tika ceremony.',
    image: '/images/nepalflagwave.png', // Replace with actual event image
  },
  {
    id: 2,
    title: 'Welcome Party Spring 2024',
    date: 'January 20, 2024',
    description: 'Welcome party for new Nepalese students joining ULM in Spring 2024 semester.',
    image: '/images/nepalflagwave.png', // Replace with actual event image
  },
  {
    id: 3,
    title: 'Nepali New Year 2080',
    date: 'April 14, 2023',
    description: 'New Year celebration with cultural program, Nepali cuisine, and music.',
    image: '/images/nepalflagwave.png', // Replace with actual event image
  },
];

export default function PastEvents() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Past Events
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Relive the memories of our recent events and celebrations
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105"
            >
              <div className="relative h-48">
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="text-sm text-crimson-600 font-semibold">
                  {event.date}
                </div>
                <h3 className="mt-2 text-xl font-semibold text-gray-900">
                  {event.title}
                </h3>
                <p className="mt-3 text-base text-gray-500">
                  {event.description}
                </p>
                <div className="mt-4">
                  <button className="text-crimson-600 hover:text-crimson-700 font-medium">
                    View Photos →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 