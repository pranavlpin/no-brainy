/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  distDir: process.env.NOBRAINY_TEST_SERVER === '1' ? 'evidences/next-test' : '.next',
}

module.exports = nextConfig
