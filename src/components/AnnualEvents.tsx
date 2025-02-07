import Image from 'next/image';

const annualEvents = [
  {
    id: 1,
    title: 'Dashain Celebration',
    description: `Dashain is the most auspicious festival in the Nepalese annual calendar. At NSA ULM, we celebrate this 
    festival with great enthusiasm, bringing together our community for traditional ceremonies and festivities. The event 
    includes the traditional tika ceremony, where elders bless younger ones with red tika and jamara. We serve authentic 
    Nepalese cuisine, organize cultural performances, and share the joy of this festival with our ULM family.`,
    timing: 'October (Date varies based on Lunar calendar)',
  },
  {
    id: 2,
    title: 'Welcome Party',
    description: `At the beginning of each semester, NSA ULM hosts a welcome party for new Nepalese students. This event 
    serves as a crucial introduction to campus life and the local community. New students get to meet senior students, 
    faculty members, and local Nepalese families. We provide essential information about academic life, cultural adjustment, 
    and available resources.`,
    timing: 'January (Spring) and August (Fall)',
  },
  {
    id: 3,
    title: 'Nepali New Year',
    description: `The Nepali New Year celebration is a vibrant showcase of our cultural heritage. We organize this event to 
    mark the beginning of the Nepali calendar year with traditional customs and modern festivities. The celebration includes 
    cultural performances, traditional music and dance, and a feast of authentic Nepali dishes.`,
    timing: 'Mid-April',
  },
];

export default function AnnualEvents() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Annual Events
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Join us in celebrating our culture and building community through these annual traditions
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {annualEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="relative h-48">
                <Image
                  src="/images/everestbackground.jpg"
                  alt="NSA ULM Event"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <h3 className="absolute bottom-4 left-4 text-xl font-bold text-white">
                  {event.title}
                </h3>
              </div>
              <div className="p-6">
                <div className="text-sm text-crimson-600 font-semibold mb-3">
                  {event.timing}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 