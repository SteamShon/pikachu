import { zodResolver } from "@hookform/resolvers/zod";
import type {
  ContentType,
  Integration,
  Placement,
  Service,
} from "@prisma/client";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import CustomLoadingButton from "../../common/CustomLoadingButton";
import type { IntegrationSchemaType } from "../../schema/integration";
import { integrationSchema } from "../../schema/integration";
import CubeIntegration from "./cubeIntegration";
import PikachuApiIntegration from "./pikachuApiIntegration";
import SmsIntegration from "./smsIntegration";
import UserFeatureIntegration from "./userFeatureIntegration";

function IntegrationForm({
  service,
  initialData,
  onSubmit,
}: {
  service: Service & {
    placements: Placement[];
    contentTypes: ContentType[];
    integrations: Integration[];
  };
  initialData?: Integration & {
    placement: Placement;
  };
  onSubmit: (input: IntegrationSchemaType) => void;
}) {
  // const providers = service?.providers || [];
  const [provide, setProvide] = useState<string | undefined>(undefined);
  const [integration, setIntegration] = useState<typeof initialData>(undefined);
  const methods = useForm<IntegrationSchemaType>({
    resolver: zodResolver(integrationSchema),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  console.log(errors);

  useEffect(() => {
    const details = initialData?.details as {
      // eslint-disable-next-line @typescript-eslint/ban-types
      [x: string]: {};
    };
    if (initialData) {
      reset({
        ...initialData,
        details,
      });
      // handleProviderChange(initialData.providerId);
    }
    setIntegration(initialData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, reset]);

  const components = () => {
    const empty = {} as Record<string, JSX.Element>;
    if (!provide) return empty;

    switch (provide) {
      case "USER_FEATURE":
        return {
          db: (
            <>
              <UserFeatureIntegration
                service={service}
                initialData={integration}
                name="details"
              />
            </>
          ),
        };
      case "API":
        return {
          http: (
            <>
              <PikachuApiIntegration
                service={service}
                initialData={initialData}
                name="details"
              />
            </>
          ),
        };
      case "SMS":
        return {
          http: (
            <>
              <SmsIntegration
                service={service}
                initialData={initialData}
                name="details"
              />
            </>
          ),
        };
      case "CUBE":
        return {
          SQL: (
            <>
              <textarea
                className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                rows={3}
                {...register("details.SQL")}
              />

              <CubeIntegration
                service={service}
                initialData={initialData}
                name="details.SQL"
              />
            </>
          ),
        };
      default:
        return empty;
    }
  };
  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} id="integration-form">
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Integration
            </h3>
            <input
              type="hidden"
              value={service.id}
              {...register("serviceId")}
            />
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Provide</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("provide")}
                    // defaultValue={initialData?.type || "DISPLAY"}
                    onChange={(e) => setProvide(e.target.value)}
                  >
                    <option value="">Please select</option>
                    <option value="CUBE">CUBE</option>
                    <option value="USER_FEATURE">USER_FEATURE</option>
                    <option value="CREATIVE_FETCHER">CREATIVE_FETCHER</option>
                    <option value="RANKER">RANKER</option>
                    <option value="SMS">SMS</option>
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
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Details
            </h3>
          </div>
          {Object.entries(components()).map(([key, component]) => {
            return (
              <>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">{key}</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    {component}
                  </dd>
                </div>
              </>
            );
          })}
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

export default IntegrationForm;
