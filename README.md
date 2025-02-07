# NSA ULM Website

This is the official website for the Nepalese Student Association at the University of Louisiana Monroe. The website is built using Next.js, Tailwind CSS, and Firebase Authentication.

## Features

- Modern, responsive design
- User authentication (login/signup)
- Protected dashboard
- About section
- Contact information
- Mobile-friendly navigation

## Prerequisites

- Node.js 16.x or later
- npm or yarn
- A Firebase project

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd nsa-ulm
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
- Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
- Enable Email/Password authentication in the Authentication section
- Copy your Firebase configuration from Project Settings

4. Set up environment variables:
- Copy the `.env.local.example` file to `.env.local`
- Fill in your Firebase configuration values in `.env.local`

```bash
cp .env.local.example .env.local
```

5. Run the development server:
```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Building for Production

To create a production build:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

## Project Structure

- `/src/app` - Next.js app router pages
- `/src/components` - React components
- `/src/lib` - Utility functions and configurations
- `/public` - Static assets

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For any questions or concerns, please contact the NSA ULM team at nsa@ulm.edu
