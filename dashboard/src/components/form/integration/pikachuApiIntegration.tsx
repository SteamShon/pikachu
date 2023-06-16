import type { Integration } from "@prisma/client";
import axios from "axios";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { jsonParseWithFallback } from "../../../utils/json";
import Badge from "../../common/Badge";
import type IntegrationForm from "./integrationForm";
import ContentTypeInfoBuilder from "../contentType/contentTypeInfoBuilder";

function PikachuApiIntegration({
  service,
  initialData,
  name,
}: {
  service: Parameters<typeof IntegrationForm>[0]["service"];
  initialData: Parameters<typeof IntegrationForm>[0]["initialData"];
  name: string;
}) {
  const [checked, setChecked] = useState<boolean | undefined>(undefined);

  const methods = useFormContext();
  const { register, getValues, setValue, control, watch } = methods;

  const validate = async () => {
    const uri = getValues(`${name}.uri`) as string | undefined;
    const values = getValues(`${name}.defaultValues`) as string | undefined;
    if (!uri || !values) return;

    const payload = jsonParseWithFallback(values);
    try {
      const result = await axios.post(
        uri,
        {
          ...payload,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (result.status === 200) {
        setValue("status", "PUBLISHED");
      }
      setChecked(result.status === 200);
    } catch (error) {
      setChecked(false);
    }
  };

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Uri</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <input
                className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                {...register("details.uri")}
              />
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Payload</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              {watch(`${name}.defaultValues`)}
            </dd>
          </div>
        </dl>
      </div>
      <div className="border-t border-gray-200">
        <ContentTypeInfoBuilder
          title="Payload Schema"
          hideCodeEditor={true}
          fieldPrefix={name}
          details={initialData?.details}
        />
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
  );
}

export default PikachuApiIntegration;
