import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { api } from "../utils/api";
import ErrorMessage from "./common/ErrorMessage";
import Loading from "./common/Loading";

function Navbar() {
  const router = useRouter();
  const { serviceId } = router.query;

  const {
    data: services,
    isLoading,
    isError,
    error,
  } = api.user.getServices.useQuery();

  const service = services?.find((service) => service.serviceId === serviceId);
  if (isLoading) return <Loading />;
  if (isError) return <ErrorMessage error={error} />;

  return (
    <nav className="bg-gray-800">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                <select
                  id="service-select"
                  className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white"
                  defaultValue={service?.serviceId}
                  onChange={(e) => {
                    router.push(`/service/${e.target.value}/dashboard`);
                  }}
                >
                  {(services || []).map((service) => {
                    return (
                      <option key={service.serviceId} value={service.serviceId}>
                        {service?.service.name}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-end">
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                <Link
                  className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white"
                  aria-current="page"
                  href={"/service/list"}
                >
                  Service
                </Link>
                <Link
                  className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white"
                  aria-current="page"
                  href={"/admin/usersOnServices/list"}
                >
                  Members
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
