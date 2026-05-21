import type { NextConfig } from 'next';

/** Set true when building for Unaux / static FTP (goozoo.unaux.com). */
const isStaticExport = process.env.UNAUX_STATIC_EXPORT === 'true';

const nextConfig: NextConfig = {
  output: isStaticExport ? 'export' : undefined,
  trailingSlash: isStaticExport ? true : undefined,
  typescript: {
    ignoreBuildErrors: true, // টাইপস্ক্রিপ্টের কোনো ওয়ার্নিং বা ছোট ভুলের জন্য বিল্ড আটকাবে না
  },
  eslint: {
    ignoreDuringBuilds: true, // কোড ফরম্যাটিং ভুলের জন্য বিল্ড ফেইল হবে না
  },
  images: {
    unoptimized: true, // স্ট্যাটিক এক্সপোর্টের জন্য ইমেজ অপ্টিমাইজেশন ট্রু রাখা আবশ্যক
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;