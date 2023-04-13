import { Grid, Step, StepButton, Stepper } from "@mui/material";
import type { Cube, CubeHistory, ServiceConfig } from "@prisma/client";
import axios from "axios";
import { useEffect, useState } from "react";
import { AiOutlineCloudUpload } from "react-icons/ai";
import { api } from "../../utils/api";
import QueryResultTable from "../common/QueryResultTable";
import CircularProgress from "@mui/material/CircularProgress";

function CubeHistoryForm({
  cube,
}: {
  cube: Cube & {
    serviceConfig?: ServiceConfig;
    cubeHistories: CubeHistory[];
  };
}) {
  const [rows, setRows] = useState<{ [x: string]: unknown }[] | undefined>(
    undefined
  );
  const [activeStep, setActiveStep] = useState(0);
  const [cubeHistories, setCubeHistories] = useState<CubeHistory[]>([]);

  useEffect(() => {
    const cubeHistories = cube.cubeHistories;
    cubeHistories.sort((a, b) => (a.version < b.version ? 1 : -1));
    setCubeHistories(cubeHistories);
  }, [cube.cubeHistories]);

  const { mutate: update } = api.cube.updateCubeHistory.useMutation({
    onSuccess(updated) {
      const cubeHistories = updated.cubeHistories;
      cubeHistories.sort((a, b) => (a.version < b.version ? 1 : -1));
      setCubeHistories(cubeHistories);
    },
  });
  const params = {
    serviceConfig: cube.serviceConfig,
    cube: cube,
  };
  const { mutate: addNewVersion } = api.cube.addNewVersion.useMutation({
    onSuccess(created) {
      const stepIndex = steps.findIndex((step) => step.label === "Transform");
      setActiveStep(stepIndex);

      const cubeHistories = created.cubeHistories;
      cubeHistories.sort((a, b) => (a.version < b.version ? 1 : -1));
      setCubeHistories(cubeHistories);
      const cubeHistory = cubeHistories[0];

      if (!cube || !cube.sql || !cube.serviceConfig || !cubeHistory) return;

      const load = async () => {
        await axios.post(`/api/integration/pg`, {
          ...params,
          cubeHistory,
          step: "transform",
        });
        let stepIndex = steps.findIndex((step) => step.label === "Upload");
        setActiveStep(stepIndex);
        update({ ...cubeHistory, status: "TRANSFORMED" });

        await axios.post(`/api/integration/pg`, {
          ...params,
          cubeHistory,
          step: "upload",
        });
        stepIndex = steps.findIndex((step) => step.label === "Cleanup");
        setActiveStep(stepIndex);
        update({ ...cubeHistory, status: "UPLOADED" });

        await axios.post(`/api/integration/pg`, {
          ...params,
          cubeHistory,
          step: "cleanup",
        });
        stepIndex = steps.findIndex((step) => step.label === "List");
        setActiveStep(stepIndex);

        update({ ...cubeHistory, status: "READY" });
      };
      load();
    },
  });
  const selectSamples = async (cubeHistory: CubeHistory) => {
    const result = await axios.post(`/api/integration/pg`, {
      ...params,
      cubeHistory,
      step: "select",
    });
    console.log(result);
    setRows(result.data);
  };
  const latestCubeHistory = cubeHistories.filter(
    (ch) => ch.status === "READY"
  )[0];

  const steps = [
    {
      label: "List",
      description: "Cube Histories",
      component: (
        <>
          <ul className={`pt-2`}>
            {cubeHistories.map((cubeHistory) => (
              <>
                <li
                  key={cubeHistory.id}
                  className={`mt-2 flex cursor-pointer items-center gap-x-4 rounded-md p-2 text-sm text-gray-700 hover:bg-slate-50`}
                >
                  <span
                    className={`whitespace-nowrap rounded-full  px-2.5 py-0.5 text-sm ${
                      cubeHistory.id === latestCubeHistory?.id
                        ? "bg-green-100 "
                        : "bg-yellow-100 "
                    }`}
                  >
                    {cubeHistory.id === latestCubeHistory?.id
                      ? "Live"
                      : "Archieved"}
                  </span>
                  <span>{cubeHistory.id}</span>
                  <span className={`text-bold font-medium`}>
                    {cubeHistory.version}
                  </span>
                  <span>{cubeHistory.status}</span>
                  <button
                    type="button"
                    onClick={() => selectSamples(cubeHistory)}
                  >
                    Show
                  </button>
                  <button type="button" onClick={() => setRows(undefined)}>
                    Hide
                  </button>
                </li>
              </>
            ))}
          </ul>
          <div className="text-center">
            {rows && <QueryResultTable rows={rows} />}
          </div>
        </>
      ),
    },
    {
      label: "Transform",
      description: "Transform S3 dataset for import",
      component: (
        <>
          <div className="font-medium">
            Read AWS S3 parquer file, then transform it into UserFeature format.
            This make takes some time depends on your data size.
            <CircularProgress />
          </div>
        </>
      ),
    },
    {
      label: "Upload",
      description: "Import csv file from S3 to UserFeature table",
      component: (
        <>
          <div className="font-medium">
            Open steam from UserFeature dataset then copy it into postgres. This
            make takes some time depends on your data size.
            <CircularProgress />
          </div>
        </>
      ),
    },
    {
      label: "Cleanup",
      description: "Cleanup CubeHistory and UserFeature partitions",
      component: (
        <>
          <div className="font-medium">
            Now upload finished, cleaning old histoies and partitions. This is
            necessary to avoid creating too many table partition on UserFeature
            table and keep history short on CubeHistory table.
            <CircularProgress />
          </div>
        </>
      ),
    },
  ];

  return (
    <>
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto">
          <h1 className="text-center text-2xl font-bold sm:text-3xl">
            User Feature Storage
          </h1>

          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              onClick={() => addNewVersion({ cubeId: cube.id })}
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
            >
              <AiOutlineCloudUpload />
              <span className="ml-2">Bulkload</span>
            </button>
            <span className="mt-1 mr-10 text-gray-500">
              bulkload cube dataset into database(postgres) using `COPY FROM`
              command.
            </span>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
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
    </>
  );
}

export default CubeHistoryForm;
