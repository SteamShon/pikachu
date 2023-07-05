import { zodResolver } from "@hookform/resolvers/zod";
import type {
  Content,
  ContentType,
  Integration,
  Provider,
  Segment,
  Service,
} from "@prisma/client";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import type { ContentTypeSchemaType } from "../../schema/contentType";
import { contentTypeSchema } from "../../schema/contentType";
import ContentTypeDetailsBuilder from "./contentTypeDetailsBuilder";
import SMSContentTypeDetailsBuilder from "./smsContentTypeDetailsBuilder";

function ContentTypeForm({
  service,
  initialData,
  onSubmit,
}: {
  service: Service & {
    integrations: (Integration & {
      provider: Provider | null;
      segments: Segment[];
    })[];
  };
  initialData?: ContentType & {
    contents: Content[];
  };
  onSubmit: (input: ContentTypeSchemaType & { serviceId: string }) => void;
}) {
  const [, setSource] = useState<string | undefined>(undefined);
  const [type, setType] = useState<string | undefined>(undefined);

  // eslint-disable-next-line @typescript-eslint/ban-types
  const details = initialData?.details as { [x: string]: {} };
  const methods = useForm<ContentTypeSchemaType & { serviceId: string }>({
    resolver: zodResolver(contentTypeSchema),
    defaultValues: {
      ...initialData,
      serviceId: initialData?.serviceId || undefined,
      details,
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { serviceId, source, type, ...others } = initialData || {};

    reset({
      ...others,
      serviceId: serviceId || undefined,
      details,
    });
    setSource(source);
    setType(type);
  }, [details, initialData, reset]);

  const detailsBuilder = () => {
    switch (type) {
      case "SMS":
        return (
          <>
            <SMSContentTypeDetailsBuilder
              service={service}
              contentType={initialData}
              fieldPrefix="details"
            />
            {/* <ContentTypeInfoBuilder details={initialData?.details} />; */}
          </>
        );
      default:
        return (
          <>
            <ContentTypeDetailsBuilder details={initialData?.details} />;
          </>
        );
    }
  };

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
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("type")}
                    defaultValue={initialData?.type || "DISPLAY"}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="">Please select</option>
                    <option value="DISPLAY">DISPLAY</option>
                    <option value="SMS">SMS</option>
                  </select>
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
          <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-lg text-center">
              <h1 className="text-2xl font-bold sm:text-3xl">Details</h1>

              {/* <p className="mt-4 text-gray-500">
                Define schema, defaultValues, rendering code.
              </p> */}
            </div>

            <div className="mx-auto mt-8 mb-0 space-y-4">
              <label
                htmlFor="details"
                className="relative block overflow-hidden rounded-md border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
              >
                {detailsBuilder()}
              </label>
            </div>
          </div>
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
