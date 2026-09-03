/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Native/binary packages — must not be webpack-bundled, only
    // resolved at runtime. onnxruntime-node and sharp both ship
    // platform-specific compiled bindings that bundling would break.
    serverComponentsExternalPackages: ['onnxruntime-node', 'sharp'],
  },
}

module.exports = nextConfig
