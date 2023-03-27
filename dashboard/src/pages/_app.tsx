import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";

import { api } from "../utils/api";

import Layout from "../components/Layout";
import "../styles/globals.css";

import { useRouter } from "next/router";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";
import { env } from "../env/client.mjs";

// Check that PostHog is client-side (used to handle Next.js SSR)
if (typeof window !== "undefined") {
  if (env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
      // debug: true,
      // Disable in development
      loaded: (posthog) => {
        console.log(posthog);
        // if (process.env.NODE_ENV === "development") posthog.opt_out_capturing();
      },
    });
  }
}
const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const router = useRouter();

  useEffect(() => {
    // Track page views
    const handleRouteChange = () => posthog?.capture("$pageview");
    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SessionProvider session={session}>
      <PostHogProvider client={posthog}>
        <Layout Component={Component} pageProps={pageProps} />
      </PostHogProvider>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
