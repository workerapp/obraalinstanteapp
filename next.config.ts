
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com', // Added for Firebase Storage
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    allowedDevOrigins: [
      'https://6000-firebase-studio-1748657581481.cluster-joak5ukfbnbyqspg4tewa33d24.cloudworkstations.dev',
    ],
  },
  webpack: (config, { isServer, webpack }) => {
    // Alias Handlebars to its precompiled version to avoid 'require.extensions' error with Webpack
    // This is a common workaround for projects using Handlebars with Webpack.
    config.resolve.alias = {
      ...config.resolve.alias,
      'handlebars': 'handlebars/dist/handlebars.js',
    };
    return config;
  },
};

export default nextConfig;

