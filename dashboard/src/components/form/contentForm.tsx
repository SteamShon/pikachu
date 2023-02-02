import { zodResolver } from "@hookform/resolvers/zod";
import {
  materialCells,
  materialRenderers,
} from "@jsonforms/material-renderers";
import { JsonForms } from "@jsonforms/react";
import type { Content, ContentType } from "@prisma/client";
import { useEffect, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { LivePreview, LiveProvider } from "react-live";
import { jsonParseWithFallback } from "../../utils/json";
import { replacePropsInFunction } from "../common/CodeTemplate";
import CustomLoadingButton from "../common/CustomLoadingButton";
import type {
  ContentSchemaType,
  ContentWithContentTypeSchemaType,
} from "../schema/content";
import { contentWithContentTypeSchema } from "../schema/content";

function ContentForm({
  contentTypes,
  initialData,
  onSubmit,
}: {
  contentTypes: ContentType[];
  initialData?: Content & { contentType: ContentType };
  onSubmit: (input: ContentSchemaType & { contentTypeId: string }) => void;
}) {
  const [contentType, setContentType] = useState<ContentType | undefined>(
    undefined
  );
  // eslint-disable-next-line @typescript-eslint/ban-types
  const [defaultValues, setDefaultValues] = useState<{ [x: string]: {} }>({});

  const methods = useForm<ContentWithContentTypeSchemaType>({
    resolver: zodResolver(contentWithContentTypeSchema),
  });

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = methods;

  useEffect(() => {
    const { values, ...others } = initialData || {};

    setContentType(initialData?.contentType);
    // eslint-disable-next-line @typescript-eslint/ban-types
    const parsedValues = jsonParseWithFallback(values) as { [x: string]: {} };

    setDefaultValues(parsedValues);

    reset({
      ...others,
      contentTypeId: initialData?.contentType.id,
      values: parsedValues,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset, initialData]);

  return (
    <>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} id="content-form">
          <div className="overflow-hidden bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Content
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    ContentType
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <select
                      {...register("contentTypeId")}
                      defaultValue={initialData?.contentTypeId || undefined}
                      disabled={initialData ? true : false}
                      onChange={(e) => {
                        setContentType(
                          contentTypes.find(
                            (contentType) => contentType.id === e.target.value
                          )
                        );
                      }}
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
                    {errors.contentTypeId && (
                      <p role="alert">{errors.contentTypeId?.message}</p>
                    )}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <input
                      className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                      defaultValue={initialData?.name}
                      {...register("name")}
                    />
                    {errors.name && <p role="alert">{errors.name?.message}</p>}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Description
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <textarea
                      className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                      defaultValue={initialData?.description || undefined}
                      rows={3}
                      {...register("description")}
                    />
                    {errors.description && (
                      <p role="alert">{errors.description?.message}</p>
                    )}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <select
                      {...register("status")}
                      defaultValue={initialData?.status || "CREATED"}
                    >
                      <option value="">Please choose</option>
                      <option value="CREATED">CREATED</option>
                      <option value="PUBLISHED">PUBLISHED</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                    {errors.status && (
                      <p role="alert">{errors.status?.message}</p>
                    )}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Values</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <Controller
                      name="values"
                      control={control}
                      rules={{ required: true }}
                      render={({}) => (
                        <JsonForms
                          schema={jsonParseWithFallback(contentType?.schema)}
                          //uischema={uiSchema}
                          data={defaultValues}
                          renderers={materialRenderers}
                          cells={materialCells}
                          onChange={({ data }) => {
                            if (Object.keys(data).length === 0) return;
                            //field.onChange(data);
                            setValue("values", data);
                            setDefaultValues(data);
                          }}
                        />
                      )}
                    />
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          <div className="overflow-hidden bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Preview
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <LiveProvider
                code={replacePropsInFunction({
                  code: contentType?.uiSchema || undefined,
                  contents: [defaultValues],
                })}
                noInline={true}
              >
                <dl>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Preview
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <LivePreview />
                    </dd>
                  </div>
                </dl>
              </LiveProvider>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <CustomLoadingButton
              handleSubmit={handleSubmit}
              onSubmit={onSubmit}
            />
          </div>
        </form>
      </FormProvider>
    </>
  );
}

export default ContentForm;
