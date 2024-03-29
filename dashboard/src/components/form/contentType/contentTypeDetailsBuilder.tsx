import {
  materialCells,
  materialRenderers,
} from "@jsonforms/material-renderers";
import { JsonForms } from "@jsonforms/react";
import JsonSchemaEditor from "@optum/json-schema-editor";
import type { Prisma } from "@prisma/client";
import { useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
// import { LiveEditor, LiveError, LivePreview, LiveProvider } from "react-live";
import { toNewCreative } from "../../../utils/contentType";
import { extractValue, jsonParseWithFallback } from "../../../utils/json";
import CodeEditor from "../../builder/codeEditor";
import { removeRenderFunction } from "../../common/CodeTemplate";

function ContentTypeDetailsBuilder({
  title,
  fieldPrefix,
  hideCodeEditor,
  details,
}: {
  title?: string;
  fieldPrefix?: string;
  hideCodeEditor?: boolean;
  details?: Prisma.JsonValue;
}) {
  const prefix = fieldPrefix || "details";
  const [schema, setSchema] = useState<string | undefined>(undefined);
  const [defaultValues, setDefaultValues] = useState<string | undefined>(
    undefined
  );
  const [code, setCode] = useState<string | undefined>(undefined);

  const methods = useFormContext();
  const { control, register } = methods;
  const initialSchema = extractValue({
    object: details,
    paths: ["schema"],
  }) as string | undefined;
  const initialDefaultValues = extractValue({
    object: details,
    paths: ["defaultValues"],
  }) as string | undefined;
  const initialCode = extractValue({ object: details, paths: ["code"] }) as
    | string
    | undefined;

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
  const currentCode = () => {
    return code || initialCode;
  };
  useEffect(() => {
    const schema = extractValue({ object: details, paths: ["schema"] }) as
      | string
      | undefined;
    const defaultValues = extractValue({
      object: details,
      paths: ["defaultValues"],
    }) as string | undefined;
    const code = extractValue({
      object: details,
      paths: ["code"],
    }) as string | undefined;

    setSchema(schema);
    setDefaultValues(defaultValues);
    setCode(code);
  }, [details]);

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          {title || "JSON Schema Builder for Content Type"}
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
                {...register(`${prefix}.schema`)}
              />
              <Controller
                name={`${prefix}.schema`}
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
                      field.onChange(newSchema);
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
                name={`${prefix}.defaultValues`}
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
          {!(hideCodeEditor || false) && (
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Render Component Code
              </dt>

              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <Controller
                  name={`${prefix}.code`}
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <CodeEditor
                      code={currentCode()}
                      creatives={[toNewCreative(defaultValues)]}
                      options={{
                        editor: {
                          disable: false,
                          onChange: (newCode: string) => {
                            console.log(newCode);
                            const newCodeWithoutRender =
                              removeRenderFunction(newCode);

                            setCode(newCodeWithoutRender);
                            // setValue(
                            //   "contentTypeInfo.details.code",
                            //   newCodeWithoutRender
                            // );
                            field.onChange(newCodeWithoutRender);
                            //setCode(newCodeWithoutRender);
                          },
                        },
                      }}
                    />
                  )}
                />
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}

export default ContentTypeDetailsBuilder;
