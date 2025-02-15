/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'drive.google.com',
      'lh3.googleusercontent.com', // For Google Drive thumbnails
      'i.imgur.com', // Imgur as an alternative
      'res.cloudinary.com', // Cloudinary as an alternative
    ],
  },
};

module.exports = nextConfig; 