import type { BuilderContent } from "@builder.io/react";
import { BuilderComponent } from "@builder.io/react";
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
import { LivePreview, LiveProvider } from "react-live";
import { getContents } from "../../pages/api/builder.io/builderContent";
import { extractValue, jsonParseWithFallback } from "../../utils/json";
import { replacePropsInFunction } from "../common/CodeTemplate";
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
  contentTypes: (ContentType & { contentTypeInfo?: ContentTypeInfo | null })[];
  initialData?: Content & { contentType: ContentType };
  onSubmit: (input: ContentSchemaType & { contentTypeId: string }) => void;
}) {
  console.log(initialData);
  const [contentType, setContentType] = useState<
    typeof contentTypes[0] | undefined
  >(undefined);
  const [schema, setSchema] = useState<string | undefined>(undefined);
  // eslint-disable-next-line @typescript-eslint/ban-types
  const [defaultValues, setDefaultValues] = useState<{ [x: string]: {} }>({});
  const [builderContents, setBuilderContens] = useState<BuilderContent[]>([]);
  const [builderContent, setBuilderContent] = useState<
    BuilderContent | undefined
  >(undefined);

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
    const currentContentType = contentTypes.find(
      (ct) => ct.id === initialData?.contentType?.id
    );
    setContentType(currentContentType);
    const schema = extractValue({
      object: currentContentType?.contentTypeInfo?.details,
      paths: ["schema"],
    }) as string | undefined;
    setSchema(schema);
    // eslint-disable-next-line @typescript-eslint/ban-types
    const parsedValues = jsonParseWithFallback(values) as { [x: string]: {} };

    setDefaultValues(parsedValues);
    if (currentContentType?.source === "builder.io" && initialData) {
      setBuilderContent(parsedValues as unknown as BuilderContent);
    }
    reset({
      ...others,
      contentTypeId: initialData?.contentType.id,
      values: parsedValues,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset, initialData]);

  useEffect(() => {
    const builderPublicKey = extractValue({
      object: service?.serviceConfig?.builderConfig,
      paths: ["publicKey"],
    }) as string | undefined;
    const modelName = extractValue({
      object: contentType?.contentTypeInfo?.details,
      paths: ["name"],
    }) as string | undefined;

    if (builderPublicKey && contentType?.source === "builder.io" && modelName) {
      getContents({
        builderPublicKey,
        modelName,
        options: { limit: 10, userAttributes: { urlPath: "/test" } },
      }).then((contents) => setBuilderContens(contents));
    }
  }, [contentType, service?.serviceConfig?.builderConfig]);

  const handleBuilderContentSelect = (contentName: string) => {
    const content = builderContents.find((c) => c.name === contentName);

    if (content) {
      setValue("name", content.name);
      setValue("values", content as unknown as Record<string, unknown>);
    }
    setBuilderContent(content);
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
                {contentType?.source === "builder.io" ? (
                  <>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        BuilderIO Content
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                        <select
                          onChange={(e) =>
                            handleBuilderContentSelect(e.target.value)
                          }
                          value={builderContent?.name}
                        >
                          <option value="">Please choose</option>
                          {builderContents.map((content) => {
                            return (
                              <option key={content.name} value={content.name}>
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
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Values</dt>
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
        <BuilderComponent model={contentType?.name} content={builderContent} />

        <LiveProvider
          code={replacePropsInFunction({
            code: extractValue({
              object: contentType?.contentTypeInfo?.details,
              paths: ["code"],
            }) as string | undefined,
            contents: [defaultValues],
          })}
          noInline={true}
        >
          <LivePreview />
        </LiveProvider>
      </div>
    </>
  );
}

export default ContentForm;
