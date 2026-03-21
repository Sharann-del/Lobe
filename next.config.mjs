/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["mapbox-gl"],
  experimental: {
    // Avoid broken/missing server vendor chunks for Supabase (see Next + Supabase docs).
    serverComponentsExternalPackages: [
      "@supabase/supabase-js",
      "@supabase/ssr",
    ],
  },
};

export default nextConfig;
