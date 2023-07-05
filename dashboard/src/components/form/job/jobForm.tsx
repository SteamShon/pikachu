import { zodResolver } from "@hookform/resolvers/zod";
import type { Job } from "@prisma/client";
import axios from "axios";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import type { fromServiceTree } from "../../../utils/tree";
import CustomLoadingButton from "../../common/CustomLoadingButton";
import MyLoadingButton from "../../common/MyLoadingButton";
import type { JobSchemaType } from "../../schema/job";
import { jobSchema } from "../../schema/job";

function JobForm({
  service,
  initialData,
  onSubmit,
}: {
  service: ReturnType<typeof fromServiceTree>;
  initialData?: Job;
  onSubmit: (input: JobSchemaType) => void;
}) {
  console.log(initialData);
  const [integration, setIntegration] = useState<
    typeof service.integrations[0] | undefined
  >(undefined);
  const [placement, setPlacement] = useState<
    typeof service.placements[0] | undefined
  >(undefined);

  const methods = useForm<JobSchemaType>({
    resolver: zodResolver(jobSchema),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = methods;

  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line @typescript-eslint/ban-types
      const details = initialData.details as { [x: string]: {} };
      reset({ ...initialData, details });
      const integration = service.integrations.find(
        ({ id }) => id === initialData.integrationId
      );
      setIntegration(integration);
      const placement = service.placements.find(
        ({ id }) => id === initialData.placementId
      );
      setPlacement(placement);
    }
  }, [initialData, reset, service.integrations, service.placements]);

  const handleIntegrationChange = (integrationId: string) => {
    const integration = service.integrations.find(
      ({ id }) => id === integrationId
    );
    setIntegration(integration);
  };

  const handlePlacementChange = (placementId: string) => {
    const placement = service.placements.find(({ id }) => id === placementId);
    setPlacement(placement);

    setValue("details.placement", placement);
    setValue("details.integration", integration);
  };

  const runJob = async () => {
    const job = getValues();
    try {
      const { data } = await axios.post(`/api/job/smsJob`, {
        jobId: job.id,
        route: "processJob",
      });
      console.log(data);
    } catch (e) {
      console.log(e);
    }
  };
  // const handleAdSetChanges = (adSetIds: string[]) => {
  //   const adSets = adSetIds.map((id) =>
  //     placement?.adSets.find((adSet) => adSet.id === id)
  //   );

  //   setValue("details.adSets", adSets);
  // };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} id="job-form">
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Job</h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Integration
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("integrationId")}
                    onChange={(e) => handleIntegrationChange(e.target.value)}
                  >
                    <option value="">Please choose</option>
                    {service.integrations.map(({ id, name }) => {
                      return (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Placement</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("placementId")}
                    onChange={(e) => handlePlacementChange(e.target.value)}
                  >
                    <option value="">Please choose</option>
                    {service.placements.map(({ id, name }) => {
                      return (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  ContentType
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {placement?.contentType.name}
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
            </dl>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">AdSets</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {placement?.adSets.map((adSet) => {
                    return (
                      <div key={adSet.id}>
                        {adSet.name}
                        {adSet.status}
                      </div>
                    );
                  })}
                </dd>
              </div>
            </dl>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Details.Schedule{" "}
                  <a
                    href="https://crontab.guru/"
                    rel="noreferrer"
                    target="_blank"
                  >
                    <p>crontab guru</p>
                  </a>
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <textarea
                    className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                    rows={3}
                    {...register("details.schedule")}
                    placeholder="* * * * *"
                  />
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <CustomLoadingButton
            // disabled={checkValidate() && !checked}
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
          />
          <MyLoadingButton label="Run" onClick={() => runJob()} />
        </div>
      </form>
    </FormProvider>
  );
}

export default JobForm;
