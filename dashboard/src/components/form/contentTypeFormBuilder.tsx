import {
  materialCells,
  materialRenderers,
} from "@jsonforms/material-renderers";
import { JsonForms } from "@jsonforms/react";
import type { Content, ContentType } from "@prisma/client";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { jsonParseWithFallback } from "../../utils/json";

function ContentTypeFormBuilder({
  initialData,
  schema,
  defaultValues,
  setDefaultValues,
}: {
  initialData?: ContentType & { contents: Content[] };
  schema?: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
  defaultValues: { [x: string]: {} };
  setDefaultValues: Dispatch<
    SetStateAction<{
      // eslint-disable-next-line @typescript-eslint/ban-types
      [x: string]: {};
    }>
  >;
}) {
  const methods = useFormContext();
  const { control, reset } = methods;

  useEffect(() => {
    reset(initialData, { keepValues: true });
  }, [initialData, reset]);

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
                    schema={jsonParseWithFallback(schema)}
                    //uischema={uiSchema}
                    data={defaultValues}
                    renderers={materialRenderers}
                    cells={materialCells}
                    onChange={({ data }) => {
                      if (Object.keys(data).length === 0) return;

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
