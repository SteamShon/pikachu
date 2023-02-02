import { type NextPage } from "next";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Login from "../components/Login";

const Home: NextPage = () => {
  const { data: session } = useSession();
  if (session) {
    return (
      <>
        <div>Signed in as {session?.user?.email} </div>
        <div>
          <Link href={"/service/list"}>Go To Service List</Link>
        </div>
        <div>
          <button onClick={() => signOut()}>Sign out</button>
        </div>
      </>
    );
  }
  return (
    <>
      <section className="h-screen">
        <Login />
      </section>
    </>
  );
};

export default Home;
