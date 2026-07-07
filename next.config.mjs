/** @type {import('next').NextConfig} */
const nextConfig = {
    // Image optimization configuration
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },

    // Disable strict mode for better compatibility with some libraries
    reactStrictMode: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    compiler: {
        styledComponents: true,
    },
    output: 'standalone',
};

export default nextConfig;
