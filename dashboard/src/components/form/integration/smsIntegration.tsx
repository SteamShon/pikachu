import type { ContentType, Integration, Provider } from "@prisma/client";
import axios from "axios";
import { useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { extractValue, jsonParseWithFallback } from "../../../utils/json";
import Badge from "../../common/Badge";
import type IntegrationForm from "./integrationForm";
import ContentTypeInfoBuilder from "../contentType/contentTypeInfoBuilder";
import { JsonForms } from "@jsonforms/react";
import {
  materialCells,
  materialRenderers,
} from "@jsonforms/material-renderers";
const SMS_TEST_SCHEMA = {
  type: "object",
  properties: {
    from: {
      type: "string",
      title: "from",
    },
    text: {
      type: "string",
      title: "text",
    },
    tos: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },
  required: ["from", "to", "text"],
};
function SmsIntegration({
  service,
  initialData,
  provider,
  name,
}: {
  service: Parameters<typeof IntegrationForm>[0]["service"];
  initialData: Parameters<typeof IntegrationForm>[0]["initialData"];
  provider?: Provider;
  name: string;
}) {
  const [checked, setChecked] = useState<boolean | undefined>(undefined);
  const [formSchema, setFormSchema] = useState<string | undefined>(
    JSON.stringify(SMS_TEST_SCHEMA)
  );
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});

  const methods = useFormContext();
  const { control, reset, register, getValues, setValue } = methods;

  useEffect(() => {
    const details = initialData?.details as {
      [x: string]: unknown;
    };
    if (initialData) {
      reset({
        ...initialData,
        details,
      });
      setFormSchema(details.schema as string);
      setFormValues(details.values as Record<string, unknown>);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const validate = async () => {
    const details = extractValue({
      object: provider?.details,
      paths: ["values"],
    });
    const payload = getValues(`${name}.values`) as Record<string, unknown>;

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
        details,
      });

      setChecked(result.status === 200);
    } catch (error) {
      setChecked(false);
    }
  };

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <input type="hidden" value={formSchema} {...register(`${name}.schema`)} />
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Uri</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <input
                className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                {...register(`${name}.uri`)}
              />
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Test Payload</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <Controller
                name={`${name}.values`}
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <>
                    {formSchema && (
                      <JsonForms
                        schema={jsonParseWithFallback(formSchema)}
                        data={formValues}
                        renderers={materialRenderers}
                        cells={materialCells}
                        onChange={({ data }) => {
                          if (Object.keys(data).length === 0) return;

                          field.onChange(data);
                          setFormValues(data);
                        }}
                      />
                    )}
                  </>
                )}
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
  );
}

export default SmsIntegration;
