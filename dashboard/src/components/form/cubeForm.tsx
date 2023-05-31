import { zodResolver } from "@hookform/resolvers/zod";
import { Grid, Step, StepButton, Stepper } from "@mui/material";
import type {
  Cube,
  CubeHistory,
  Provider,
  Service,
  ServiceConfig,
} from "@prisma/client";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import SqlBuilder from "../builder/sqlBuilder";
import SqlPreview from "../builder/sqlPreview";
import CustomLoadingButton from "../common/CustomLoadingButton";
import type { CubeSchemaType } from "../schema/cube";
import { cubeSchema } from "../schema/cube";
import type { DatasetSchemaType } from "../schema/dataset";
import CubeHistoryForm from "./cubeHistoryForm";
import { buildJoinSql, fromSql } from "../../utils/providers/awsS3DuckDB";

function CubeForm({
  service,
  initialData,
  onSubmit,
}: {
  service: Service & {
    serviceConfig?: ServiceConfig | null;
    providers: Provider[];
  };
  initialData?: Cube & {
    serviceConfig?: ServiceConfig;
    cubeHistories: CubeHistory[];
  };
  onSubmit: (input: CubeSchemaType) => void;
}) {
  const providers = (service?.providers || []).filter(
    ({ provide }) => provide === "CUBE"
  );

  const [provider, setProvider] = useState<Provider | undefined>(undefined);
  const [activeStep, setActiveStep] = useState(0);

  const methods = useForm<CubeSchemaType>({
    resolver: zodResolver(cubeSchema),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = methods;

  console.log(errors);

  useEffect(() => {
    reset({
      ...(initialData ? initialData : {}),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, reset]);

  const steps = [
    {
      label: "QueryBuilder",
      description: `QueryBuilder`,
      component:
        provider?.provide === "CUBE" && provider?.name === "AWS_S3_DUCKDB" ? (
          <SqlBuilder
            provider={provider}
            initialData={fromSql(initialData?.sql || undefined)}
            onSubmit={(data: DatasetSchemaType) => {
              setValue("sql", buildJoinSql({ provider, dataset: data }));
              setActiveStep((prev) => prev + 1);
            }}
          />
        ) : (
          <>{`${provider?.provide}_${provider?.name} is not supported yet.`}</>
        ),
    },
    {
      label: "Preview",
      description: `Preview`,
      component:
        provider?.provide === "CUBE" && provider?.name === "AWS_S3_DUCKDB" ? (
          <SqlPreview provider={provider} sql={getValues("sql") || ""} />
        ) : (
          <></>
        ),
    },
    {
      label: "Save",
      description: `Save`,
      component: (
        <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <CustomLoadingButton
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
          />
        </div>
      ),
    },
  ];
  const handleProviderChange = (newProviderId: string) => {
    const provider = providers.find(({ id }) => id === newProviderId);

    setProvider(provider);
    if (provider) {
      setValue("providerId", provider.id);
    }
  };
  return (
    <FormProvider {...methods}>
      <form id="cubeConfig-form">
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Cube
            </h3>
            {/* <input
              type="hidden"
              {...register("serviceConfigId")}
              value={service?.serviceConfig?.id}
            /> */}
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Provider</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    onChange={(e) => handleProviderChange(e.target.value)}
                  >
                    <option value="">Please select</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                  {errors.providerId && (
                    <p role="alert">{errors.providerId?.message}</p>
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
                <dt className="text-sm font-medium text-gray-500">SQL</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <textarea
                    className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                    rows={5}
                    defaultValue={initialData?.sql || undefined}
                    {...register("sql")}
                  />
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-lg text-center">
            <h1 className="text-2xl font-bold sm:text-3xl">Cube Builder</h1>
          </div>
          <div>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Stepper nonLinear activeStep={activeStep}>
                  {steps.map((step, index) => (
                    <Step key={step.label}>
                      <StepButton
                        onClick={() => {
                          setActiveStep(index);
                        }}
                      >
                        {step.label}
                      </StepButton>
                    </Step>
                  ))}
                </Stepper>
              </Grid>
              <Grid item xs={12}>
                {steps[activeStep]?.component}
              </Grid>
            </Grid>
          </div>
        </div>
        {initialData && <CubeHistoryForm cube={initialData} />}
      </form>
    </FormProvider>
  );
}

export default CubeForm;
