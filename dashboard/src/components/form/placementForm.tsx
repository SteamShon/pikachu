import { zodResolver } from "@hookform/resolvers/zod";
import LoadingButton from "@mui/lab/LoadingButton";
import type { ContentType, Placement } from "@prisma/client";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import type { buildPlacementGroupTree } from "../../utils/tree";
import type { PlacementWithPlacementGroupSchemaType } from "../schema/placement";
import { placementWithPlacementGroupSchema } from "../schema/placement";

function PlacementForm({
  placementGroups,
  contentTypes,
  initialData,
  onSubmit,
}: {
  placementGroups: ReturnType<typeof buildPlacementGroupTree>[];
  contentTypes: ContentType[];
  initialData?: Placement;
  onSubmit: (input: PlacementWithPlacementGroupSchemaType) => void;
}) {
  const [loading, setLoading] = useState(false);
  const placementGroup =
    placementGroups.length === 1 ? placementGroups[0] : undefined;

  const methods = useForm<PlacementWithPlacementGroupSchemaType>({
    resolver: zodResolver(placementWithPlacementGroupSchema),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  useEffect(() => {
    reset({
      ...(initialData ? initialData : {}),
      placementGroupId: placementGroup?.id,
    });
  }, [reset, placementGroup, initialData]);

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
                <dt className="text-sm font-medium text-gray-500">
                  PlacementGroup
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("placementGroupId")}
                    defaultValue={
                      initialData?.placementGroupId || placementGroup?.id
                    }
                    disabled={initialData ? true : false}
                  >
                    <option value="">Please choose</option>
                    {placementGroups.map((placementGroup) => {
                      return (
                        <option
                          key={placementGroup.id}
                          value={placementGroup.id}
                        >
                          {placementGroup.name}
                        </option>
                      );
                    })}
                  </select>
                  {errors.placementGroupId && (
                    <p role="alert">{errors.placementGroupId?.message}</p>
                  )}
                </dd>
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
                    defaultValue={initialData?.contentTypeId}
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
            </dl>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <LoadingButton
            type="submit"
            variant="contained"
            loadingPosition="end"
            onClick={handleSubmit((input) => {
              setLoading(true);
              onSubmit(input);
            })}
            loading={loading}
            className="inline-flex w-full justify-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
          >
            <span>Save</span>
          </LoadingButton>
        </div>
      </form>
    </FormProvider>
  );
}

export default PlacementForm;
