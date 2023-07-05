import { zodResolver } from "@hookform/resolvers/zod";
import {
  materialCells,
  materialRenderers,
} from "@jsonforms/material-renderers";
import { JsonForms } from "@jsonforms/react";
import type { Content, ContentType } from "@prisma/client";
import { useEffect, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import {
  extractSchema,
  toNewCreativeFromObject,
} from "../../../utils/contentType";
import { jsonParseWithFallback } from "../../../utils/json";
import { toSmsContentTypeDetails } from "../../../utils/smsContentType";
import ContentPreview from "../../builder/contentPreview";

import CustomLoadingButton from "../../common/CustomLoadingButton";
import type {
  ContentSchemaType,
  ContentWithContentTypeSchemaType,
} from "../../schema/content";
import { contentWithContentTypeSchema } from "../../schema/content";
import SMSContentValuesForm from "./smsContentValuesForm";

function ContentForm({
  service,
  contentTypes,
  initialData,
  onSubmit,
}: {
  service: Parameters<typeof ContentPreview>[0]["service"];
  contentTypes: ContentType[];
  initialData?: Content & { contentType: ContentType };
  onSubmit: (input: ContentSchemaType & { contentTypeId: string }) => void;
}) {
  console.log(contentTypes);
  const [contentType, setContentType] = useState<
    typeof contentTypes[0] | undefined
  >(undefined);
  const [schema, setSchema] = useState<string | undefined>(undefined);
  // eslint-disable-next-line @typescript-eslint/ban-types
  const [defaultValues, setDefaultValues] = useState<{ [x: string]: {} }>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  const methods = useForm<ContentWithContentTypeSchemaType>({
    resolver: zodResolver(contentWithContentTypeSchema),
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = methods;

  useEffect(() => {
    if (initialData) {
      const update = async () => {
        const initialContentType = contentTypes.find(
          (ct) => ct.id === initialData.contentType?.id
        );
        if (initialContentType) {
          handleContentTypeSelect(initialContentType?.id);
        }

        // eslint-disable-next-line @typescript-eslint/ban-types
        const parsedValues = jsonParseWithFallback(initialData.values) as {
          // eslint-disable-next-line @typescript-eslint/ban-types
          [x: string]: {};
        };

        setDefaultValues(parsedValues);

        reset({
          ...initialData,
          contentTypeId: initialData?.contentType.id,
          values: parsedValues,
        });
      };
      update();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  // useEffect(() => {
  //   setSchema(extractSchema(contentType));
  // }, [contentType]);

  const handleContentTypeSelect = async (contentTypeId: string) => {
    const newContentType = contentTypes.find(
      (contentType) => contentType.id === contentTypeId
    );

    setContentType(newContentType);
    setSchema(extractSchema(newContentType));
  };

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
                      disabled={initialData ? true : false}
                      onChange={(e) => handleContentTypeSelect(e.target.value)}
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
                {contentType?.source === "local" ? (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Values
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <Controller
                        name="values"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                          <>
                            {contentType?.type === "SMS" ? (
                              <SMSContentValuesForm
                                contentTypeDetails={
                                  toSmsContentTypeDetails(
                                    contentType?.details
                                  ) || {}
                                }
                                service={service}
                                contentValues={
                                  initialData?.values
                                    ? jsonParseWithFallback(initialData?.values)
                                    : undefined
                                }
                                fieldPrefix="values"
                                setValue={(key: string, value: unknown) =>
                                  setValue(`values.${key}`, value)
                                }
                              />
                            ) : (
                              <>
                                <JsonForms
                                  schema={jsonParseWithFallback(schema)}
                                  //uischema={uiSchema}
                                  data={defaultValues}
                                  renderers={materialRenderers}
                                  cells={materialCells}
                                  onChange={({ data }) => {
                                    if (Object.keys(data).length === 0) return;

                                    field.onChange(data);
                                    //setValue("values", data);
                                    setDefaultValues(data);
                                  }}
                                />
                                <ContentPreview
                                  service={service}
                                  contentType={contentType}
                                  creatives={[
                                    toNewCreativeFromObject(defaultValues),
                                  ]}
                                />
                              </>
                            )}
                          </>
                        )}
                      />
                    </dd>
                  </div>
                ) : null}
              </dl>
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
