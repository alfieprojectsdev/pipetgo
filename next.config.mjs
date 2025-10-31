/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    domains: ['uploadthing.com', 'utfs.io'],
  },
};

export default nextConfig;
