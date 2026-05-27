/** @type {import('next').NextConfig} */
const nextConfig = {
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