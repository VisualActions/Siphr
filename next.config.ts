import type { NextConfig } from "next";

const SECURITY_HEADERS = [
  // Clickjacking — the app should never be embedded in another origin.
  { key: "X-Frame-Options", value: "DENY" },
  // MIME-sniffing defense.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Referrer leakage: send only the origin to other sites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Lock down ambient browser APIs we don't use anywhere.
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  },
  // 1 year HSTS — siphr.dev is HTTPS-only.
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const config: NextConfig = {
  async headers() {
    return [
      // Apply baseline security headers to every route.
      { source: "/:path*", headers: SECURITY_HEADERS },
    ];
  },
};

export default config;
