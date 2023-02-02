import { useSession } from "next-auth/react";
import Navbar from "./Navbar";
import Login from "./Login";

export default function Layout({ Component, pageProps: { ...pageProps } }) {
  const { data: session } = useSession();

  if (!session) return <Login />;
  return (
    <>
      <Navbar />
      <Component {...pageProps} />
    </>
  );
}
