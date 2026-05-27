/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'oqljaetajijjkyfwwfss.supabase.co',
      },
    ],
  },
}

export default nextConfig