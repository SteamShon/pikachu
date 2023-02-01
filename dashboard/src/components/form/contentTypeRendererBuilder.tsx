import type { Content, ContentType } from "@prisma/client";
import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { LiveEditor, LiveError, LivePreview, LiveProvider } from "react-live";
import {
  removeRenderFunction,
  replacePropsInFunction,
} from "../common/CodeTemplate";

function ContentTypeRendererBuilder({
  initialData,
  defaultValues,
  code,
  setCode,
}: {
  initialData?: ContentType & { contents: Content[] };
  defaultValues?: {
    // eslint-disable-next-line @typescript-eslint/ban-types
    [x: string]: {};
  };
  code?: string;
  setCode: Dispatch<SetStateAction<string | undefined>>;
}) {
  const methods = useFormContext();

  const { control, reset, getValues } = methods;

  useEffect(() => {
    reset(initialData, { keepValues: true });
  }, [initialData, reset]);

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Renderer
        </h3>
      </div>
      <div className="border-t border-gray-200">
        <Controller
          name="uiSchema"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <LiveProvider
              code={replacePropsInFunction({
                code,
                contents: [defaultValues as Record<string, unknown>],
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

                          //setValue("uiSchema", newCodeWithoutRender);
                          field.onChange(newCodeWithoutRender);
                          //setCode(newCodeWithoutRender);
                        }}
                      />
                    </div>
                    {
                      <div className="inline-flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setCode(getValues("uiSchema") || undefined)
                          }
                          className="w-full rounded-md border border-transparent bg-violet-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                          Compile & Run Preview
                        </button>
                      </div>
                    }
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Preview</dt>
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
      </div>
      <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
        <button
          type="submit"
          className="inline-flex w-full justify-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
        >
          Save
        </button>
      </div>
    </div>
  );
}

export default ContentTypeRendererBuilder;
