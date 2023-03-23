import type { Service, ServiceConfig } from "@prisma/client";
import { useFormContext } from "react-hook-form";

function BuilderIOConfigForm({
  service,
  name,
}: {
  name: string;
  service?: Service & { serviceConfig?: ServiceConfig };
}) {
  const { register } = useFormContext();

  return (
    <>
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">Buidler IO Config</h1>

          <p className="mt-4 text-gray-500">
            It is possible to integrate with other excellent external CMS
            systems(ex: Builder.IO), and when integrated, the content can be
            modified and managed in the CMS. Picachu will provide targeting and
            ranking based on customer behaviors on theses contents
          </p>
        </div>

        <div className="mx-auto mt-8 mb-0 max-w-md space-y-4">
          <label
            htmlFor="publicKey"
            className="relative block overflow-hidden rounded-md border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <input
              id="publicKey"
              placeholder="publicKey"
              className="peer h-8 w-full border-none bg-transparent p-0 placeholder-transparent focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              {...register(`${name}.publicKey`)}
            />

            <span className="absolute left-3 top-3 -translate-y-1/2 text-xs text-gray-700 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs">
              publicKey
            </span>
          </label>
          <label
            htmlFor="privateKey"
            className="relative block overflow-hidden rounded-md border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <input
              id="privateKey"
              placeholder="privateKey"
              className="peer h-8 w-full border-none bg-transparent p-0 placeholder-transparent focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              {...register(`${name}.privateKey`)}
            />

            <span className="absolute left-3 top-3 -translate-y-1/2 text-xs text-gray-700 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs">
              privateKey
            </span>
          </label>
        </div>
      </div>
    </>
  );
}
export default BuilderIOConfigForm;
