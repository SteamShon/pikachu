import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";

import { api } from "../utils/api";

import { Analytics } from "@vercel/analytics/react";
import Navbar from "../components/Navbar";
import "../styles/globals.css";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <Navbar />
      <Component {...pageProps} />
      <Analytics />
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
