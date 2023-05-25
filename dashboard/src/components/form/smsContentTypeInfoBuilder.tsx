import {
  materialCells,
  materialRenderers,
} from "@jsonforms/material-renderers";
import { JsonForms } from "@jsonforms/react";
import JsonSchemaEditor from "@optum/json-schema-editor";
import type { Content, ContentType, ContentTypeInfo } from "@prisma/client";
import { useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
// import { LiveEditor, LiveError, LivePreview, LiveProvider } from "react-live";
import {
  extractCode,
  extractDefaultValues,
  extractSchema,
  toNewCreative,
} from "../../utils/contentTypeInfo";
import { jsonParseWithFallback } from "../../utils/json";
import CodeEditor from "../builder/codeEditor";
import { removeRenderFunction } from "../common/CodeTemplate";
export const DefaultSMSContentTypeSchema = {
  type: "object",
  title: "",
  description: "",
  properties: {
    messages: {
      type: "array",
      title: "messages",
      description: "",
      items: {
        type: "object",
        title: "message",
        description: "",
        properties: {
          to: { type: "string", title: "to", description: "", properties: {} },
          from: {
            type: "string",
            title: "from",
            description: "",
            properties: {},
          },
          text: {
            type: "string",
            title: "text",
            description: "",
            properties: {},
          },
        },
        required: ["to", "from", "field_bwls", "text"],
      },
    },
  },
  required: ["messages"],
};
function SMSContentTypeInfoBuilder({
  contentType,
}: {
  contentType?: ContentType & {
    contentTypeInfo?: ContentTypeInfo | null;
    contents: Content[];
  };
}) {
  const [schema, setSchema] = useState<string | undefined>(
    JSON.stringify(DefaultSMSContentTypeSchema)
  );
  const [defaultValues, setDefaultValues] = useState<string | undefined>(
    undefined
  );
  const [code, setCode] = useState<string | undefined>(undefined);

  const methods = useFormContext();
  const { control, register } = methods;
  const initialSchema = extractSchema(contentType?.contentTypeInfo);
  const initialDefaultValues = extractDefaultValues(
    contentType?.contentTypeInfo
  );
  const initialCode = extractCode(contentType?.contentTypeInfo);

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
    const schema = extractSchema(contentType?.contentTypeInfo) || "{}";
    const defaultValues = extractDefaultValues(contentType?.contentTypeInfo);
    const code = extractCode(contentType?.contentTypeInfo);

    setSchema(schema);
    setDefaultValues(defaultValues);
    setCode(code);
  }, [contentType?.contentTypeInfo]);

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          JSON Schema Builder for Content Type
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
                {...register("contentTypeInfo.details.schema")}
              />
              <Controller
                name="contentTypeInfo.details.schema"
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
                name="contentTypeInfo.details.defaultValues"
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
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">
              Render Component Code
            </dt>
            {/* <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <Controller
                name="contentTypeInfo.details.code"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <LiveProvider
                    code={replacePropsInFunction({
                      code: currentCode(),
                      contents: [jsonParseWithFallback(defaultValues)],
                    })}
                    noInline={true}
                  >
                    <dl>
                      <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">
                          Renderer Code
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                          <div>
                            <LiveEditor
                              onChange={(newCode) => {
                                const newCodeWithoutRender =
                                  removeRenderFunction(newCode);

                                setCode(newCodeWithoutRender);
                                //setValue("uiSchema", newCodeWithoutRender);
                                field.onChange(newCodeWithoutRender);
                                //setCode(newCodeWithoutRender);
                              }}
                            />
                          </div>
                        </dd>
                      </div>
                      <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">
                          Preview
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                          <LivePreview />
                        </dd>
                      </div>
                      <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">
                          Preview Erros
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                          <LiveError />
                        </dd>
                      </div>
                    </dl>
                  </LiveProvider>
                )}
              />
            </dd> */}
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <Controller
                name="contentTypeInfo.details.code"
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
        </dl>
      </div>
    </div>
  );
}

export default SMSContentTypeInfoBuilder;
