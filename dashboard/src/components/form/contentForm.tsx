import type { BuilderContent } from "@builder.io/react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  materialCells,
  materialRenderers,
} from "@jsonforms/material-renderers";
import { JsonForms } from "@jsonforms/react";
import type {
  Content,
  ContentType,
  ContentTypeInfo,
  Service,
  ServiceConfig,
} from "@prisma/client";
import { useEffect, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import {
  getContent,
  getContents,
} from "../../pages/api/builder.io/builderContent";
import {
  extractDefaultValues,
  extractSchema,
} from "../../utils/contentTypeInfo";
import { jsonParseWithFallback } from "../../utils/json";
import ContentPreview from "../builder/contentPreview";
import CustomLoadingButton from "../common/CustomLoadingButton";
import type {
  ContentSchemaType,
  ContentWithContentTypeSchemaType,
} from "../schema/content";
import { contentWithContentTypeSchema } from "../schema/content";

function ContentForm({
  service,
  contentTypes,
  initialData,
  onSubmit,
}: {
  service: Service & { serviceConfig?: ServiceConfig | null };
  contentTypes: (ContentType & { contentTypeInfo: ContentTypeInfo | null })[];
  initialData?: Content & { contentType: ContentType };
  onSubmit: (input: ContentSchemaType & { contentTypeId: string }) => void;
}) {
  const [contentType, setContentType] = useState<
    typeof contentTypes[0] | undefined
  >(undefined);
  const [schema, setSchema] = useState<string | undefined>(undefined);
  // eslint-disable-next-line @typescript-eslint/ban-types
  const [defaultValues, setDefaultValues] = useState<{ [x: string]: {} }>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [builderContents, setBuilderContens] = useState<
    BuilderContent<object>[]
  >([]);
  const [builderContent, setBuilderContent] = useState<
    BuilderContent<object> | undefined
  >(undefined);
  const [needUpdate, setNeedUpdate] = useState(false);

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
    if (initialData) {
      const update = async () => {
        console.log("initial!!!");
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
        if (initialContentType && initialContentType?.source === "builder.io") {
          const contentId = parsedValues?.id as string | undefined;
          const lastUpdated = parsedValues?.lastUpdated as number | undefined;

          getContent({
            serviceConfig: service?.serviceConfig,
            contentType: initialContentType,
            contentId,
          }).then((content) => {
            if (content === undefined) return;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            const newLastUpdated = content?.lastUpdated;
            if (lastUpdated && lastUpdated < newLastUpdated) {
              setNeedUpdate(true);
            }
            setBuilderContent(content);
            setValue("name", content.name);
            setValue("values", content as unknown as Record<string, unknown>);
          });
        }

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

  const handleContentTypeSelect = async (contentTypeId: string) => {
    console.log("contentType changed!!!");
    const newContenType = contentTypes.find(
      (contentType) => contentType.id === contentTypeId
    );
    setContentType(newContenType);
    setSchema(extractSchema(newContenType?.contentTypeInfo));

    if (newContenType?.source === "builder.io") {
      const contents = await getContents({
        serviceConfig: service?.serviceConfig,
        contentType: newContenType,
      });
      setBuilderContens(contents || []);
    }
  };
  const handleBuilderContentSelect = async (
    newContenType: typeof contentType,
    contentId: string
  ) => {
    console.log("content changed!!!");
    setSchema(extractSchema(newContenType?.contentTypeInfo));

    // eslint-disable-next-line @typescript-eslint/ban-types
    const parsedValues = jsonParseWithFallback(
      extractDefaultValues(newContenType?.contentTypeInfo)
    ) as {
      // eslint-disable-next-line @typescript-eslint/ban-types
      [x: string]: {};
    };
    setDefaultValues(parsedValues);

    const lastUpdated = parsedValues?.lastUpdated as number | undefined;
    if (!newContenType || newContenType?.source !== "builder.io" || !contentId)
      return;

    const updatedContent = await getContent({
      serviceConfig: service?.serviceConfig,
      contentType,
      contentId,
    });
    // const content = builderContents.find((c) => c.id === contentId);

    if (updatedContent) {
      setValue("name", updatedContent.name);
      setValue("values", updatedContent as unknown as Record<string, unknown>);
      setNeedUpdate(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (lastUpdated || updatedContent.lastUpdated) < updatedContent.lastUpdated
      );
    }
    setBuilderContent(updatedContent);
  };

  return (
    <>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} id="content-form">
          <div className="overflow-hidden bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Content
                {needUpdate ? (
                  <span className="inline-flex items-center justify-end rounded-full bg-red-100 px-2.5 py-0.5 text-red-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      className="-ml-1 mr-1.5 h-4 w-4"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                      />
                    </svg>

                    <p className="whitespace-nowrap text-sm">
                      {" "}
                      outdated. Save again
                    </p>
                  </span>
                ) : null}
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
                {contentType?.source === "builder.io" ? (
                  <>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        BuilderIO Content
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                        <select
                          onChange={(e) =>
                            handleBuilderContentSelect(
                              contentType,
                              e.target.value
                            )
                          }
                          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                          // @ts-ignore
                          value={builderContent?.id}
                        >
                          <option value="">Please choose</option>
                          {builderContents.map((content) => {
                            return (
                              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                              // @ts-ignore
                              <option key={content.name} value={content.id}>
                                {content.name}
                              </option>
                            );
                          })}
                        </select>
                        {errors.contentTypeId && (
                          <p role="alert">{errors.contentTypeId?.message}</p>
                        )}
                      </dd>
                    </div>
                  </>
                ) : null}
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
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">Preview</h1>
        </div>
      </div>
      <div className="mx-auto mt-8 mb-0 space-y-4 ">
        <ContentPreview
          contentType={contentType}
          contents={[
            builderContent
              ? (builderContent as unknown as Record<string, unknown>)
              : defaultValues,
          ]}
        />
      </div>
    </>
  );
}

export default ContentForm;
