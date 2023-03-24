import {
  Box,
  Button,
  Grid,
  Paper,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import React from "react";
import SideMenu from "../../../components/SideMenu";

function PublisherStep() {
  const [activeStep, setActiveStep] = React.useState(0);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };
  const steps = [
    {
      label: "Service",
      component: (
        <Typography>{`
      Create/Configure Service. 

      Service is the place where Publisher/Advertiser meet using placement
      `}</Typography>
      ),
    },
    {
      label: "ContentType",
      component: <Typography>Create/Configure ContentType</Typography>,
    },
    {
      label: "Cube",
      component: <Typography>Create/Configure Cube</Typography>,
    },
    {
      label: "Placement",
      component: <Typography>Create/Configure Placement</Typography>,
    },
  ];
  return (
    <>
      <Grid
        container
        direction="row"
        justifyContent="flex-start"
        alignItems="stretch"
      >
        <Grid item xs={2} sx={{ height: "100%" }}>
          <SideMenu />
        </Grid>

        <Grid item xs={10} sx={{ height: "100%" }}>
          <Box>
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel
                    optional={
                      index === steps.length - 1 ? (
                        <Typography variant="caption">Last step</Typography>
                      ) : null
                    }
                  >
                    {step.label}
                  </StepLabel>
                  <StepContent>
                    {step.component}
                    <Box sx={{ mb: 2 }}>
                      <div>
                        <Button onClick={handleNext} sx={{ mt: 1, mr: 1 }}>
                          {index === steps.length - 1 ? "Finish" : "Continue"}
                        </Button>
                        <Button
                          disabled={index === 0}
                          onClick={handleBack}
                          sx={{ mt: 1, mr: 1 }}
                        >
                          Back
                        </Button>
                      </div>
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
            {activeStep === steps.length && (
              <Paper square elevation={0} sx={{ p: 3 }}>
                <Typography>
                  All steps completed - you&apos;re finished
                </Typography>
                <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
                  Reset
                </Button>
              </Paper>
            )}
          </Box>
        </Grid>
      </Grid>
    </>
  );
}
export default PublisherStep;
