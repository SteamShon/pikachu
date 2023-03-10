// @ts-check
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
!process.env.SKIP_ENV_VALIDATION && (await import("./src/env/server.mjs"));

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  swcMinify: true,
  output: "standalone",
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  webpack: (webpackConfig, { isServer }) => {
    // WASM imports are not supported by default. Workaround inspired by:
    // https://github.com/vercel/next.js/issues/29362#issuecomment-1149903338
    // https://github.com/vercel/next.js/issues/32612#issuecomment-1082704675
    return {
      ...webpackConfig,
      experiments: {
        asyncWebAssembly: true,
        layers: true,
      },
      optimization: {
        ...webpackConfig.optimization,
        moduleIds: "named",
        minimize: false,
      },
      output: {
        ...webpackConfig.output,
        webassemblyModuleFilename: isServer
          ? "./../public/static/wasm/[modulehash].wasm"
          : "public/static/wasm/[modulehash].wasm",
      },
    };
  },
};
export default config;
