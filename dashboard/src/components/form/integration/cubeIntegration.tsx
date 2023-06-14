import { Grid, Step, StepButton, Stepper } from "@mui/material";
import type { Integration } from "@prisma/client";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { buildJoinSql, fromSql } from "../../../utils/awsS3DuckDB";
import SqlBuilder from "../../builder/sqlBuilder";
import SqlPreview from "../../builder/sqlPreview";
import type { DatasetSchemaType } from "../../schema/dataset";
import type IntegrationForm from "./integrationForm";
import Badge from "../../common/Badge";
import AWSS3Details from "./awsS3Details";

function CubeIntegration({
  initialData,
  name,
}: {
  initialData: Parameters<typeof IntegrationForm>[0]["initialData"];
  name: string;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [checked, setChecked] = useState<boolean | undefined>(undefined);

  const methods = useFormContext();
  const { register, reset, watch, setValue, getValues } = methods;

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
      });
    }
  }, [initialData, reset]);

  const details = watch("details");

  const steps = [
    {
      label: "Configure",
      description: `Configure`,
      component: <AWSS3Details prefix="details" />,
    },
    {
      label: "QueryBuilder",
      description: `QueryBuilder`,
      component: (
        <>
          <SqlBuilder
            details={details}
            initialData={fromSql(getValues(name) as string | undefined)}
            onSubmit={(data: DatasetSchemaType) => {
              setValue(name, buildJoinSql({ details, dataset: data }));
              setActiveStep((prev) => prev + 1);
            }}
          />
        </>
      ),
    },
    {
      label: "Preview",
      description: `Preview`,
      component: (
        <>
          {initialData && (
            <SqlPreview cubeIntegration={initialData} sql={getValues(name)} />
          )}
        </>
      ),
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
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
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
