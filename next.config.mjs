/** @type {import('next').NextConfig} */
const nextConfig = {
    // Allow the data directory to be read by API routes at runtime
    outputFileTracingIncludes: {
        '/api/sales': ['./data/**/*'],
    },
};

export default nextConfig;
