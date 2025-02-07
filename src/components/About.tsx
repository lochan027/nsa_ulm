export default function About() {
  return (
    <section id="about" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">About Us</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Nepalese Student Association at ULM
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Building bridges between cultures and creating a home away from home.
          </p>
        </div>

        <div className="mt-10">
          <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
            <div className="relative">
              <dt>
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  🎓
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Academic Support</p>
              </dt>
              <dd className="mt-2 ml-16 text-base text-gray-500">
                We provide academic resources, study groups, and mentorship opportunities to help our members excel in their studies.
              </dd>
            </div>

            <div className="relative">
              <dt>
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  🌏
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Cultural Exchange</p>
              </dt>
              <dd className="mt-2 ml-16 text-base text-gray-500">
                We organize cultural events, festivals, and activities to share Nepalese culture with the ULM community.
              </dd>
            </div>

            <div className="relative">
              <dt>
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  🤝
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Community Support</p>
              </dt>
              <dd className="mt-2 ml-16 text-base text-gray-500">
                We help new students adjust to campus life and provide a supportive community for all our members.
              </dd>
            </div>

            <div className="relative">
              <dt>
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  🎉
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Social Activities</p>
              </dt>
              <dd className="mt-2 ml-16 text-base text-gray-500">
                We organize regular social events, sports activities, and gatherings to foster friendships and networking.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
} 