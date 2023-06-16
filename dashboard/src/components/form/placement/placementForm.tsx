import { zodResolver } from "@hookform/resolvers/zod";
import type { ContentType, Integration, Placement } from "@prisma/client";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import type ContentPreview from "../../builder/contentPreview";
import CustomLoadingButton from "../../common/CustomLoadingButton";
import type { PlacementSchemaType } from "../../schema/placement";
import { placementSchema } from "../../schema/placement";

function PlacementForm({
  service,
  contentTypes,
  integrations,
  initialData,
  onSubmit,
}: {
  service: Parameters<typeof ContentPreview>[0]["service"];
  contentTypes: ContentType[];
  integrations: Integration[];
  initialData?: Placement & {
    integrations: Integration[];
  };
  onSubmit: (input: PlacementSchemaType) => void;
}) {
  const methods = useForm<PlacementSchemaType>({
    resolver: zodResolver(placementSchema),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  useEffect(() => {
    console.log(initialData);
    reset({
      ...(initialData ? initialData : {}),
      serviceId: initialData?.serviceId || undefined,
      integrationIds: (initialData?.integrations || []).map(({ id }) => id),
    });
  }, [reset, initialData]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} id="placement-form">
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Placement
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
                    {...register("name")}
                    defaultValue={initialData?.name}
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
                    rows={3}
                    {...register("description")}
                    defaultValue={initialData?.description || undefined}
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
                <dt className="text-sm font-medium text-gray-500">
                  ContentType
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("contentTypeId")}
                    defaultValue={initialData?.contentTypeId || undefined}
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
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Integrations
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    multiple
                    {...register("integrationIds")}
                    // defaultValue={initialData?.integrations || undefined}
                    className="mt-1.5 w-full rounded-lg border-gray-300 text-gray-700 sm:text-sm"
                  >
                    <option value="">Please choose</option>
                    {integrations.map((integration) => {
                      return (
                        <option key={integration.id} value={integration.id}>
                          {integration.name}
                        </option>
                      );
                    })}
                  </select>
                  {errors.integrationIds && (
                    <p role="alert">{errors.integrationIds?.message}</p>
                  )}
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
  );
}

export default PlacementForm;
