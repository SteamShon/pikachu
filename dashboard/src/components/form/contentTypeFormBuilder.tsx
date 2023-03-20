import {
  materialCells,
  materialRenderers,
} from "@jsonforms/material-renderers";
import { JsonForms } from "@jsonforms/react";
import type {
  Content,
  ContentType,
  ContentTypeInfo,
  Prisma,
} from "@prisma/client";
import { Dispatch, SetStateAction, useState } from "react";
import { useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { extractValue, jsonParseWithFallback } from "../../utils/json";
import { removeRenderFunction } from "../common/CodeTemplate";

function ContentTypeFormBuilder({
  contentType,
}: {
  contentType?: ContentType & {
    contentTypeInfo?: ContentTypeInfo | null;
    contents: Content[];
  };
}) {
  const [schema, setSchema] = useState<Record<string, unknown> | undefined>(
    undefined
  );
  const [defaultValues, setDefaultValues] = useState<
    Record<string, unknown> | undefined
  >(undefined);
  const [code, setCode] = useState<string | undefined>(undefined);

  const methods = useFormContext();
  const { control, reset } = methods;

  useEffect(() => {
    console.log(contentType?.contentTypeInfo);
    const schema = extractValue({
      object: contentType?.contentTypeInfo?.details,
      paths: ["schema"],
    }) as Record<string, unknown> | undefined;
    const defaultValues = extractValue({
      object: contentType?.contentTypeInfo?.details,
      paths: ["defaultValues"],
    }) as Record<string, unknown> | undefined;
    const code = extractValue({
      object: contentType?.contentTypeInfo?.details,
      paths: ["code"],
    }) as string | undefined;

    setDefaultValues(defaultValues);
    setSchema(schema);
    setCode(code || removeRenderFunction(undefined));

    // reset({
    //   ...others,
    //   serviceId: serviceId || undefined,
    //   defaultValues: parsedDefaultValues,
    // });
  }, [contentType]);

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Form Builder
        </h3>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500"></dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <Controller
                name="defaultValues"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <JsonForms
                    schema={{}}
                    //uischema={uiSchema}
                    data={{}}
                    renderers={materialRenderers}
                    cells={materialCells}
                    onChange={({ data }) => {
                      if (!data || Object.keys(data).length === 0) return;

                      setDefaultValues(data);
                      //setValue("defaultValues", data);
                      field.onChange(data);
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

export default ContentTypeFormBuilder;
