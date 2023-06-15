import { Grid, Step, StepButton, Stepper } from "@mui/material";
import type { Integration, Provider } from "@prisma/client";
import type { AxiosError } from "axios";
import axios from "axios";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { extractValue } from "../../../utils/json";
import { generateTransformCubeSql } from "../../../utils/awsS3DuckDB";
import Badge from "../../common/Badge";
import QueryResultTable from "../../common/QueryResultTable";
import type IntegrationForm from "./integrationForm";

function UserFeatureIntegration({
  service,
  initialData,
  provider,
  name,
}: {
  service: Parameters<typeof IntegrationForm>[0]["service"];
  initialData: Parameters<typeof IntegrationForm>[0]["initialData"];
  provider?: Provider;
  name: string;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const cubeIntegrations = service.integrations.filter(
    ({ provide }) => provide === "CUBE"
  );
  const [checked, setChecked] = useState<boolean | undefined>(undefined);
  const [cubeIntegration, setCubeIntegration] = useState<
    typeof cubeIntegrations[0] | undefined
  >(undefined);

  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );
  const [rows, setRows] = useState<{ [x: string]: unknown }[]>([]);

  const methods = useFormContext();

  const { register, getValues, setValue } = methods;

  const validate = async () => {
    const sql = getValues(`${name}.sql`) as string | undefined;

    try {
      const { status, data } = await axios.post(`/api/integration/db`, {
        payload: {
          sql,
        },
        method: "executeQuery",
        integration: initialData,
      });
      setRows(data.rows);
      setErrorMessage(undefined);
      setValue("status", "PUBLISHED");
      setChecked(status === 200);
    } catch (error) {
      const err = error as AxiosError;
      const errorMessage = (err?.response?.data as Record<string, unknown>)
        ?.message as string;
      setErrorMessage(errorMessage);
      setChecked(false);
    }
  };
  const generateSql = (cubeHistoryId: string) => {
    return `
      SELECT  *
      FROM    "UserFeature"
      WHERE   "cubeHistoryId" = '${cubeHistoryId}'
      LIMIT   100
    `;
  };
  const upload = async () => {
    setStatus("started");
    const cubeHistoryId = String(Math.floor(new Date().getTime() / 1000));

    const transformSql = await generateTransformCubeSql({
      cubeProviderDetails: cubeIntegration?.details,
      cubeDetails: cubeIntegration?.details,
      cubeHistoryId,
    });
    setValue(`${name}.cubeHistoryId`, cubeHistoryId);

    try {
      setStatus("transforming");
      await axios.post(`/api/provider/awsS3DuckDB`, {
        method: "executeDuckDBQuery",
        integration: cubeIntegration,
        payload: {
          sql: transformSql,
        },
      });

      // create partition.
      setStatus("uploading");
      const result = await axios.post(`/api/integration/db`, {
        payload: {
          cubeHistoryId,
        },
        method: "upload",
        integration: initialData,
        cubeProvider: cubeIntegration,
      });
      setErrorMessage(undefined);
      setValue("status", "PUBLISHED");
      setChecked(result.status === 200);
      setStatus("finished");
      setActiveStep((prev) => prev + 1);
      setValue(`${name}.sql`, generateSql(cubeHistoryId));
    } catch (error) {
      console.log(error);
      const err = error as AxiosError;
      const errorMessage = (err?.response?.data as Record<string, unknown>)
        ?.message as string;
      setErrorMessage(errorMessage);
      setChecked(false);
      setStatus("error");
    }
  };
  const handleIntegrationChange = async (integrationId: string) => {
    const cubeIntegration = cubeIntegrations.find(
      ({ id }) => id === integrationId
    );
    setCubeIntegration(cubeIntegration);

    setValue(`${name}.cubeIntegrationId`, integrationId);
  };

  useEffect(() => {
    const cubeIntegrationId = extractValue({
      object: initialData?.details,
      paths: ["cubeIntegrationId"],
    }) as string | undefined;
    console.log(cubeIntegrationId);
    if (!cubeIntegrationId) return;

    handleIntegrationChange(cubeIntegrationId);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const steps = [
    {
      label: "Cube",
      description: `Cube`,
      component: (
        <>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">
              Cube Integration
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <select
                {...register(`${name}.cubeIntegrationId`)}
                onChange={(e) => {
                  handleIntegrationChange(e.target.value);
                  setActiveStep((prev) => prev + 1);
                }}
              >
                <option value="">Please select</option>
                {cubeIntegrations.map((integration) => {
                  return (
                    <option key={integration.id} value={integration.id}>
                      {integration.name}
                    </option>
                  );
                })}
              </select>
            </dd>
          </div>
        </>
      ),
    },
    {
      label: "Upload",
      description: `Upload`,
      component: (
        <>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Upload Cube</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              {cubeIntegration ? (
                <button
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                  type="button"
                  onClick={() => upload()}
                  disabled={status !== undefined}
                >
                  {status !== undefined && status !== "finished" && (
                    <svg
                      className="mr-3 h-5 w-5 animate-spin "
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  <span>{status || "Upload"}</span>
                </button>
              ) : (
                "Please select CubeIntegration first."
              )}
            </dd>
          </div>
        </>
      ),
    },
    {
      label: "Query",
      description: `Query`,
      component: (
        <>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">SQL</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <input
                className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                {...register(`${name}.sql`)}
              />
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Result</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <QueryResultTable rows={rows} />
            </dd>
          </div>
        </>
      ),
    },
  ];
  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="border-t border-gray-200">
        <dl>
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
          </Grid>
        </dl>
      </div>
      <div className="border-t border-gray-200">
        <dl></dl>
      </div>
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              {steps[activeStep]?.component}
            </Grid>
          </Grid>
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
        {status}
      </div>
      <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
        <button
          className="inline-flex w-full justify-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
          type="button"
          onClick={() => validate()}
        >
          Check
        </button>
        {checked === undefined ? (
          "Please Verify"
        ) : checked ? (
          <Badge variant="success" label="valid" />
        ) : (
          <Badge variant="error" label="not valid" />
        )}
        {errorMessage}
      </div>
    </div>
  );
}

export default UserFeatureIntegration;
