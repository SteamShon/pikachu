import { zodResolver } from "@hookform/resolvers/zod";
import type {
  Integration,
  IntegrationInfo,
  Placement,
  Service,
} from "@prisma/client";
import axios from "axios";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import CustomLoadingButton from "../common/CustomLoadingButton";
import type { IntegrationSchemaType } from "../schema/integration";
import { integrationSchema } from "../schema/integration";
import IntegrationInfoForm from "./integrationInfoForm";

function IntegrationForm({
  service,
  initialData,
  onSubmit,
}: {
  service: Service & { placements: Placement[] };
  initialData?: Integration & {
    placement: Placement;
    integrationInfo: IntegrationInfo | null;
  };
  onSubmit: (input: IntegrationSchemaType) => void;
}) {
  const [type, setType] = useState<string | undefined>(undefined);
  const [response, setResponse] = useState<
    | { data: Record<string, unknown>[]; status: number; statusText: string }
    | undefined
  >(undefined);

  const methods = useForm<IntegrationSchemaType>({
    resolver: zodResolver(integrationSchema),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = methods;

  useEffect(() => {
    const details = initialData?.integrationInfo?.details as {
      // eslint-disable-next-line @typescript-eslint/ban-types
      [x: string]: {};
    };
    if (initialData) {
      reset({
        ...initialData,
        integrationInfo: {
          ...initialData.integrationInfo,
          integrationId: initialData.id,
          details,
        },
      });
    }
  }, [initialData, reset]);

  const checkIntegration = async () => {
    const config = watch("integrationInfo.details");
    const result = await axios.post(`/api/integration/db`, config);

    setResponse({
      status: result.status,
      statusText: result.statusText,
      data: result.data,
    });
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} id="placement-form">
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Integration
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
                    disabled={initialData?.placementId ? true : false}
                  >
                    <option value="">Please choose</option>
                    {service.placements.map((placement) => {
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
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("type")}
                    defaultValue={initialData?.type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="">Please select</option>
                    <option value="DB">DB</option>
                    <option value="HTTP">HTTP API</option>
                  </select>
                  {errors.type && <p role="alert">{errors.type?.message}</p>}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          {initialData ? (
            <IntegrationInfoForm
              service={service}
              integration={initialData}
              type={type || "DB"}
            />
          ) : null}
        </div>
        <div className="flex flex-wrap">
          {response && JSON.stringify(response, null, 2)}
        </div>

        <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          {(initialData === undefined || response) && (
            <CustomLoadingButton
              handleSubmit={handleSubmit}
              onSubmit={onSubmit}
            />
          )}
          {initialData && (
            <button
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
              type="button"
              onClick={() => checkIntegration()}
            >
              Validate
            </button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

export default IntegrationForm;
