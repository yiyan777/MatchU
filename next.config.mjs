/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 將 domains 改為更安全的 remotePatterns
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
  // 移除 eslint 區塊，因為 Next 16 不再支援在這裡寫 eslint 忽略
};

export default nextConfig;
