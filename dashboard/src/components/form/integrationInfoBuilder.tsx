import type { Integration, Placement } from "@prisma/client";
import { useFormContext } from "react-hook-form";
import { extractParams } from "../../pages/api/integration/db";
// import { LiveEditor, LiveError, LivePreview, LiveProvider } from "react-live";

function IntegrationInfoBuilder({
  integration,
}: {
  integration?: Integration & {
    placement: Placement;
  };
}) {
  // const [schema, setSchema] = useState<string | undefined>(undefined);
  // const [defaultValues, setDefaultValues] = useState<string | undefined>(
  //   undefined
  // );
  // const [code, setCode] = useState<string | undefined>(undefined);

  const methods = useFormContext();
  const { register, watch } = methods;

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Detail Builder.
        </h3>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">DATABASE_URL</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <textarea
                className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                rows={3}
                {...register("details.DATABASE_URL")}
              />
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">SQL</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <textarea
                className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                rows={10}
                {...register("details.SQL")}
              />
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">DATA</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              {extractParams(watch("details.SQL")).map((param, index) => (
                <>
                  <div>
                    {param}:
                    <input
                      key={index}
                      className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                      {...register(`details.${param}`)}
                    />
                  </div>
                </>
              ))}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export default IntegrationInfoBuilder;
