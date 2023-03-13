import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";

import { api } from "../utils/api";

import Layout from "../components/Layout";
import "../styles/globals.css";
const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <Layout Component={Component} pageProps={pageProps} />
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
