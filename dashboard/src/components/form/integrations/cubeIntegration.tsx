import { Grid, Step, StepButton, Stepper } from "@mui/material";
import type { Provider } from "@prisma/client";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { buildJoinSql, fromSql } from "../../../utils/providers/awsS3DuckDB";
import SqlBuilder from "../../builder/sqlBuilder";
import SqlPreview from "../../builder/sqlPreview";
import type { DatasetSchemaType } from "../../schema/dataset";

function CubeIntegration({
  provider,
  name,
}: {
  provider: Provider;
  name: string;
}) {
  const [activeStep, setActiveStep] = useState(0);

  const methods = useFormContext();
  const {
    setValue,
    getValues,
    formState: { errors },
  } = methods;

  console.log(errors);
  console.log(getValues(name));
  const steps = [
    {
      label: "QueryBuilder",
      description: `QueryBuilder`,
      component: (
        <SqlBuilder
          provider={provider}
          initialData={fromSql(getValues(name) as string | undefined)}
          onSubmit={(data: DatasetSchemaType) => {
            setValue(name, buildJoinSql({ provider, dataset: data }));
            setActiveStep((prev) => prev + 1);
          }}
        />
      ),
    },
    {
      label: "Preview",
      description: `Preview`,
      component: <SqlPreview provider={provider} sql={getValues(name)} />,
    },
    // {
    //   label: "Save",
    //   description: `Save`,
    //   component: (
    //     <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
    //       <CustomLoadingButton
    //         handleSubmit={handleSubmit}
    //         onSubmit={onSubmit}
    //       />
    //     </div>
    //   ),
    // },
  ];

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
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
  );
}

export default CubeIntegration;
