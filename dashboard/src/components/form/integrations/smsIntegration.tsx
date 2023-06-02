import type { ContentType, Provider } from "@prisma/client";
import axios from "axios";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { jsonParseWithFallback } from "../../../utils/json";
import Badge from "../../common/Badge";
import ContentTypeInfoBuilder from "../contentTypeInfoBuilder";
import type IntegrationForm from "../integrationForm";

function SmsIntegration({
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
  const contentTypes = service?.contentTypes || [];
  const [checked, setChecked] = useState<boolean | undefined>(undefined);
  const [contentType, setContentType] = useState<
    typeof contentTypes[0] | undefined
  >(undefined);

  const handleContentTypeChange = (contentTypeId: string | null) => {
    const contentType = contentTypes.find(({ id }) => id === contentTypeId);
    setContentType(contentType);
  };

  const methods = useFormContext();
  const { register, getValues, setValue } = methods;

  const validate = async () => {
    const values = getValues(`${name}.defaultValues`) as string | undefined;
    const payload = jsonParseWithFallback(values);

    const from = payload.from as string;
    const text = payload.text as string;
    const tos = payload.tos as string[];

    const messages = {
      messages: tos.map((to) => {
        return { to, from, text };
      }),
    };
    try {
      const result = await axios.post(`/api/integration/solapi`, {
        payload: messages,
        method: "sendMessages",
        provider,
      });
      if (result.status === 200) {
        setValue("status", "PUBLISHED");
      }
      setChecked(result.status === 200);
    } catch (error) {
      setChecked(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      handleContentTypeChange(initialData?.contentTypeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

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
            <dt className="text-sm font-medium text-gray-500">ContentType</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <select
                {...register("contentTypeId")}
                onChange={(e) => handleContentTypeChange(e.target.value)}
              >
                <option value="">Please choose</option>
                {contentTypes.map((contentType) => {
                  return (
                    <option key={contentType.id} value={contentType.id}>
                      {contentType.name}
                    </option>
                  );
                })}
              </select>
            </dd>
          </div>
        </dl>
      </div>
      <div>
        {contentType && (
          <ContentTypeInfoBuilder
            details={contentType?.contentTypeInfo?.details}
            hideCodeEditor={true}
            fieldPrefix={name}
          />
        )}
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

export default SmsIntegration;
