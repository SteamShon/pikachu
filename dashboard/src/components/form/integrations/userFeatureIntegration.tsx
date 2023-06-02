import type { ContentType, Provider } from "@prisma/client";
import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { jsonParseWithFallback } from "../../../utils/json";
import Badge from "../../common/Badge";
import ContentTypeInfoBuilder from "../contentTypeInfoBuilder";
import type IntegrationForm from "../integrationForm";

function UserFeatureIntegration({
  service,
  initialData,
  provider,
  name,
}: {
  service: Parameters<typeof IntegrationForm>[0]["service"];
  initialData: Parameters<typeof IntegrationForm>[0]["initialData"];
  provider: Provider;
  name: string;
}) {
  const [checked, setChecked] = useState<boolean | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );

  const methods = useFormContext();
  const { register, getValues, setValue } = methods;

  const validate = async () => {
    const sql = getValues(`${name}.sql`) as string | undefined;

    try {
      const result = await axios.post(`/api/integration/pg`, {
        payload: {
          sql,
        },
        method: "executeQuery",
        provider,
      });

      setErrorMessage(undefined);
      setValue("status", "PUBLISHED");
      setChecked(result.status === 200);
    } catch (error) {
      const err = error as AxiosError;
      const errorMessage = (err?.response?.data as Record<string, unknown>)
        ?.message as string;
      setErrorMessage(errorMessage);
      setChecked(false);
    }
  };

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">SQL</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <input
                className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                {...register("details.sql")}
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
        {errorMessage}
      </div>
    </div>
  );
}

export default UserFeatureIntegration;
