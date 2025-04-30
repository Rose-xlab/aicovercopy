/** @type {import('next').NextConfig} */
const nextConfig = {
  //output: 'export', // Keep this if you need static exports
  eslint: {
    ignoreDuringBuilds: true, // Keep this if you want to ignore ESLint errors during builds
  },
  images: {
    unoptimized: true // Keep this if you don't want image optimization
  },

  // === ADD THIS LINE ===
  transpilePackages: ['undici'],
  // =====================

  // === REMOVE THIS ENTIRE BLOCK ===
  // webpack: (config, { isServer, dev }) => {
  //   // Add transpilation for undici package to handle private class fields
  //   config.module.rules.push({
  //     test: /\.js$/,
  //     include: /node_modules\/undici/,
  //     use: {
  //       loader: 'babel-loader',
  //       options: {
  //         presets: ['@babel/preset-env'],
  //         plugins: [
  //           '@babel/plugin-proposal-private-methods',
  //           '@babel/plugin-proposal-class-properties',
  //           '@babel/plugin-proposal-private-property-in-object'
  //         ]
  //       }
  //     }
  //   });
  //   return config;
  // },
  // ================================
};

export default nextConfig;