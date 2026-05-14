import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import { spawnSync } from "node:child_process";

const rawRevision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ?? "";
const revision =
  rawRevision ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  `anonymous-${crypto.randomUUID()}`;

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
});

const nextConfig: NextConfig = {};

export default withSerwist(nextConfig);
