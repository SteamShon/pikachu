import JsonSchemaEditor from "@optum/json-schema-editor";
import type { Content, ContentType } from "@prisma/client";
import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { jsonParseWithFallback } from "../../utils/json";

function ContentTypeSchemaBuilder({
  initialData,
  schema,
  setSchema,
}: {
  initialData?: ContentType & { contents: Content[] };
  schema?: string;
  setSchema: Dispatch<SetStateAction<string | undefined>>;
}) {
  const methods = useFormContext();
  const { control, register, reset, setValue } = methods;

  useEffect(() => {
    console.log(initialData);
    reset(initialData);
  }, [initialData, reset]);

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
                {...register("schema")}
              />
              <Controller
                name="schema"
                control={control}
                rules={{ required: true }}
                render={({}) => (
                  <JsonSchemaEditor
                    data={jsonParseWithFallback(schema || initialData?.schema)}
                    onSchemaChange={(schema) => {
                      setValue("schema", schema);
                      //TODO: somehow JSONSchemaEditor does not update when field.onChange.
                      //field.onChange(schema);
                      setSchema(schema);
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

export default ContentTypeSchemaBuilder;
