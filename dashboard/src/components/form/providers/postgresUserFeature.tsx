import axios from "axios";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

import Badge from "../../common/Badge";
import type { ProviderSchemaType } from "../../schema/provider";

function PostgresUserFeature() {
  const [checked, setChecked] = useState<boolean | undefined>(undefined);
  const methods = useFormContext<ProviderSchemaType>();
  const { register, watch, setValue } = methods;

  const validate = async () => {
    const details = watch("details");

    try {
      const result = await axios.post(`/api/provider/pg`, details);
      if (result.status === 200) {
        setValue("status", "PUBLISHED");
      }
      setChecked(result.status === 200);
    } catch (error) {
      setChecked(false);
    }
  };

  return (
    <>
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          {/* <h3 className="text-lg font-medium leading-6 text-gray-900">
          {channel?.type} {channel?.provider?.name} Detail Builder.
        </h3> */}
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                DATABASE_URL
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <input
                  className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                  {...register("details.DATABASE_URL")}
                  placeholder="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"
                />
              </dd>
            </div>
          </dl>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <button
            className="inline-flex w-full justify-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
            type="button"
            onClick={() => validate()}
          >
            Check
          </button>
          {checked === undefined ? (
            "Please Verify"
          ) : checked ? (
            <Badge variant="success" label="valid" />
          ) : (
            <Badge variant="error" label="not valid" />
          )}
        </div>
      </div>
    </>
  );
}
export default PostgresUserFeature;
