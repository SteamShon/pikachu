import { useSession } from "next-auth/react";
import { SnackbarProvider } from "notistack";
import Login from "./Login";
import Navbar from "./Navbar";

export default function Layout({ Component, pageProps: { ...pageProps } }) {
  const { data: session } = useSession();

  // if (!session) return <Login />;
  return (
    <>
      <SnackbarProvider>
        {/* <Navbar /> */}
        <Component {...pageProps} />
      </SnackbarProvider>
    </>
  );
}
