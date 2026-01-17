/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable React strict mode for better development experience
    reactStrictMode: true,

    // This app is 100% client-side, so we can use output: 'export' for static export
    // However, keeping it as default for now to allow flexibility

    // Webpack configuration for PDF.js worker
    webpack: (config) => {
        config.resolve.alias.canvas = false;
        config.resolve.alias.encoding = false;
        return config;
    },
};

export default nextConfig;
