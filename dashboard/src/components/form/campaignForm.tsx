// import { api } from "../../utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { TextField } from "@mui/material";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import type { Campaign } from "@prisma/client";
import { useEffect } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import type { buildPlacementTree } from "../../utils/tree";
import type { CampaignWithPlacementSchemaType } from "../schema/campaign";
import { campaignWithPlacementSchema } from "../schema/campaign";

function CampaignForm({
  placements,
  onSubmit,
  initialData,
}: {
  placements: ReturnType<typeof buildPlacementTree>[];
  onSubmit: (input: CampaignWithPlacementSchemaType) => void;
  initialData?: Campaign;
}) {
  const placement = placements.length === 1 ? placements[0] : undefined;
  const methods = useForm<CampaignWithPlacementSchemaType>({
    resolver: zodResolver(campaignWithPlacementSchema),
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  useEffect(() => {
    reset({
      ...(initialData ? initialData : {}),
      placementId: placement?.id,
    });
  }, [reset, placement, initialData]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} id="campaign-form">
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Campaign
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Placement</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("placementId")}
                    defaultValue={initialData?.placementId}
                    disabled={initialData ? true : false}
                  >
                    <option value="">Please choose</option>
                    {placements.map((placement) => {
                      return (
                        <option key={placement.id} value={placement.id}>
                          {placement.name}
                        </option>
                      );
                    })}
                  </select>
                  {errors.placementId && (
                    <p role="alert">{errors.placementId?.message}</p>
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
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("type")}
                    defaultValue={initialData?.type}
                  >
                    <option value="">Please choose</option>
                    <option value="DISPLAY">DISPLAY</option>
                    <option value="MESSAGE">MESSAGE</option>
                  </select>
                  {errors.type && <p role="alert">{errors.type?.message}</p>}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">StartedAt</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <Controller
                    name="startedAt"
                    control={control}
                    defaultValue={initialData?.startedAt}
                    render={({ field }) => (
                      <LocalizationProvider dateAdapter={AdapterMoment}>
                        <DateTimePicker
                          label="StartedAt"
                          renderInput={(params) => <TextField {...params} />}
                          {...field}
                          onChange={(value) => {
                            field.onChange(value.toDate());
                          }}
                        />
                      </LocalizationProvider>
                    )}
                  />
                  {errors.startedAt && (
                    <p role="alert">{errors.startedAt?.message}</p>
                  )}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">StartedAt</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <Controller
                    name="endAt"
                    control={control}
                    defaultValue={initialData?.startedAt}
                    render={({ field }) => (
                      <LocalizationProvider dateAdapter={AdapterMoment}>
                        <DateTimePicker
                          label="EndAt"
                          renderInput={(params) => <TextField {...params} />}
                          {...field}
                          onChange={(value) => {
                            field.onChange(value.toDate());
                          }}
                        />
                      </LocalizationProvider>
                    )}
                  />
                  {errors.endAt && <p role="alert">{errors.endAt?.message}</p>}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <button
            type="submit"
            className="inline-flex w-full justify-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Save
          </button>
        </div>
      </form>
    </FormProvider>
  );
}

export default CampaignForm;
