import { zodResolver } from "@hookform/resolvers/zod";
import type { Integration, Provider, Segment, Service } from "@prisma/client";
import { useEffect, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { formatQuery, parseJsonLogic } from "react-querybuilder";
import CustomLoadingButton from "../../common/CustomLoadingButton";
import type { SegmentSchemaType } from "../../schema/segment";
import { segmentSchema } from "../../schema/segment";
import SegmentQueryBuilder from "../segmentQueryBuilder";

function SegmentForm({
  service,
  initialData,
  onSubmit,
}: {
  service: Service & {
    providers: Provider[];
    integrations: Integration[];
  };
  initialData?: Segment;
  onSubmit: (input: SegmentSchemaType) => void;
}) {
  const cubeIntegrations = service.integrations.filter(
    ({ provide }) => provide === "CUBE"
  );
  const [cubeIntegration, setCubeIntegration] = useState<
    Integration | undefined
  >(undefined);

  const cubeProvider = service.providers.find(
    ({ id }) => id === cubeIntegration?.providerId
  );
  const methods = useForm<SegmentSchemaType>({
    resolver: zodResolver(segmentSchema),
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = methods;

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
      });
      handleIntegrationChange(initialData?.integrationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, reset]);

  const handleIntegrationChange = (integrationId: string) => {
    const integration = service.integrations.find(
      ({ id }) => id === integrationId
    );
    setCubeIntegration(integration);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} id="integration-form">
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Segment
            </h3>
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
                    {cubeIntegrations.map(({ id, name }) => {
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
                <dt className="text-sm font-medium text-gray-500">Where</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <textarea
                    className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                    rows={3}
                    {...register("where")}
                  />
                  {cubeIntegration && (
                    <Controller
                      control={control}
                      name="where"
                      render={({}) => (
                        <SegmentQueryBuilder
                          providerDetails={cubeProvider?.details}
                          integrationDetails={cubeIntegration?.details}
                          initialQuery={
                            initialData?.where
                              ? parseJsonLogic(initialData?.where)
                              : undefined
                          }
                          onQueryChange={(newQuery) => {
                            setValue(
                              "where",
                              JSON.stringify(formatQuery(newQuery, "jsonlogic"))
                            );
                          }}
                          onPopulationChange={(newPopulation) => {
                            setValue("population", newPopulation);
                          }}
                        />
                      )}
                    />
                  )}

                  {errors.where && <p role="alert">{errors.where?.message}</p>}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Population
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <input
                    className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                    {...register("population")}
                    disabled
                  />
                  {errors.population && (
                    <p role="alert">{errors.population?.message}</p>
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

export default SegmentForm;
