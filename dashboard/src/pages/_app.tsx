import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";

import { api } from "../utils/api";

import { Analytics } from "@vercel/analytics/react";
import Navbar from "../components/Navbar";
import "../styles/globals.css";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const router = useRouter();
  const [pageLoading, setPageLoading] = useState<boolean>(false);
  useEffect(() => {
    const handleStart = () => {
      setPageLoading(true);
    };
    const handleComplete = () => {
      setPageLoading(false);
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);
  }, [router]);

  return (
    <SessionProvider session={session}>
      <Navbar />
      {pageLoading ? <div>Loading...</div> : <Component {...pageProps} />}

      <Analytics />
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
