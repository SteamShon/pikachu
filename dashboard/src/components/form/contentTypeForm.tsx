import { zodResolver } from "@hookform/resolvers/zod";
import type {
  Content,
  ContentType,
  ContentTypeInfo,
  Prisma,
  Service,
  ServiceConfig,
} from "@prisma/client";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { removeRenderFunction } from "../common/CodeTemplate";
import type { ContentTypeSchemaType } from "../schema/contentType";
import { contentTypeSchema } from "../schema/contentType";
import BuilderIOModelForm from "./builderIOModelForm";
import ContentTypeInfoForm from "./contentTypeInfoForm";

function ContentTypeForm({
  service,
  initialData,
  onSubmit,
}: {
  service: Service & { serviceConfig?: ServiceConfig | null };
  initialData?: ContentType & {
    contentTypeInfo?: ContentTypeInfo | null;
    contents: Content[];
  };
  onSubmit: (input: ContentTypeSchemaType & { serviceId: string }) => void;
}) {
  const [source, setSource] = useState<string | undefined>(undefined);
  // eslint-disable-next-line @typescript-eslint/ban-types
  const details = initialData?.contentTypeInfo?.details as { [x: string]: {} };
  const methods = useForm<ContentTypeSchemaType & { serviceId: string }>({
    resolver: zodResolver(contentTypeSchema),
    defaultValues: {
      ...initialData,
      serviceId: initialData?.serviceId || undefined,
      contentTypeInfo: {
        ...initialData?.contentTypeInfo,
        details,
      },
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  useEffect(() => {
    const { serviceId, contentTypeInfo, source, ...others } = initialData || {};

    reset({
      ...others,
      serviceId: serviceId || undefined,
    });
    setSource(source);
  }, [initialData, reset]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} id="contentType-form">
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Content Type
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <input
                  type="hidden"
                  {...register(`serviceId`)}
                  value={service.id}
                />
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
                <dt className="text-sm font-medium text-gray-500">Source</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("source")}
                    defaultValue={initialData?.source || "local"}
                    onChange={(e) => setSource(e.target.value)}
                  >
                    <option value="">Please select</option>
                    <option value="local">LOCAL</option>
                    <option value="builder.io">BUILDER.IO</option>
                  </select>
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("status")}
                    defaultValue={initialData?.status}
                  >
                    <option value="CREATED">CREATED</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                  {errors.status && (
                    <p role="alert">{errors.status?.message}</p>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          {initialData ? (
            <ContentTypeInfoForm
              service={service}
              contentType={initialData}
              source={source || "local"}
            />
          ) : null}
        </div>
        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="inline-block rounded-lg bg-blue-500 px-5 py-3 text-sm font-medium text-white"
            onClick={() => handleSubmit(onSubmit)}
          >
            Save
          </button>
        </div>
      </form>
    </FormProvider>
  );
}

export default ContentTypeForm;
