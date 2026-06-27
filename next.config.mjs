/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Excel export uses SheetJS in a server route; keep it external to the bundle.
  experimental: {
    serverComponentsExternalPackages: ["xlsx"],
  },
};

export default nextConfig;
