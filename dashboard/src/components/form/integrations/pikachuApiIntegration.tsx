import {
  materialCells,
  materialRenderers,
} from "@jsonforms/material-renderers";
import { JsonForms } from "@jsonforms/react";
import JsonSchemaEditor from "@optum/json-schema-editor";
import type { Provider } from "@prisma/client";
import axios from "axios";
import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { extractValue, jsonParseWithFallback } from "../../../utils/json";
import Badge from "../../common/Badge";

function PikachuApiIntegration({
  provider,
  name,
}: {
  provider: Provider;
  name: string;
}) {
  const [checked, setChecked] = useState<boolean | undefined>(undefined);
  const [schema, setSchema] = useState<string | undefined>(
    JSON.stringify(SOLAPI_SMS_SEND_CONTENT_TYPE.schema, null, 2)
  );
  const [defaultValues, setDefaultValues] = useState<string | undefined>(
    JSON.stringify(SOLAPI_SMS_SEND_CONTENT_TYPE.defaultValues, null, 2)
  );

  const initialSchema = extractValue({
    object: provider?.details,
    paths: ["schema"],
  }) as string | undefined;
  const initialDefaultValues = extractValue({
    object: provider?.details,
    paths: ["defaultValues"],
  }) as string | undefined;

  const currentSchema = () => {
    return schema
      ? jsonParseWithFallback(schema)
      : jsonParseWithFallback(initialSchema);
  };
  const currentDefaultValues = () => {
    return defaultValues
      ? jsonParseWithFallback(defaultValues)
      : jsonParseWithFallback(initialDefaultValues);
  };

  const methods = useFormContext();
  const { register, getValues, setValue, control } = methods;

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

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          ContentType Builder
        </h3>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">
              JSON Schema Builder
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <textarea
                className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                defaultValue={schema}
                rows={3}
                {...register(`${name}.schema`)}
              />
              <Controller
                name={`${name}.schema`}
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <JsonSchemaEditor
                    data={currentSchema()}
                    onSchemaChange={(newSchema) => {
                      if (newSchema == "{}") return;
                      // console.log(schema);
                      // setValue("contentTypeInfo.details.schema", newSchema);
                      //TODO: somehow JSONSchemaEditor does not update when field.onChange.
                      // field.onChange(newSchema);
                      setSchema(newSchema);
                    }}
                  />
                )}
              />
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Form Builder</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <Controller
                name={`${name}.defaultValues`}
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <JsonForms
                    schema={currentSchema()}
                    data={currentDefaultValues()}
                    renderers={materialRenderers}
                    cells={materialCells}
                    onChange={({ data }) => {
                      if (!data || Object.keys(data).length === 0) return;

                      const newDefaultValues = JSON.stringify(data);
                      setDefaultValues(newDefaultValues);
                      //setValue("defaultValues", data);
                      field.onChange(newDefaultValues);
                    }}
                  />
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

export default PikachuApiIntegration;
