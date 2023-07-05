import type { ContentType } from "@prisma/client";
import { useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
// import { LiveEditor, LiveError, LivePreview, LiveProvider } from "react-live";
import { Grid, Step, StepButton, Stepper } from "@mui/material";
import { Mention, MentionsInput } from "react-mentions";
import { describeTable } from "../../../utils/awsS3DuckDB";
import { extractValue } from "../../../utils/json";
import type { SMSContentTypeDetail } from "../../../utils/smsContentType";
import { toSmsContentTypeDetails } from "../../../utils/smsContentType";
import { toPlainText } from "../../../utils/text";
import SMSContentValuesForm from "../content/smsContentValuesForm";
import type ContentTypeForm from "./contentTypeForm";

function SMSContentTypeDetailsBuilder({
  service,
  fieldPrefix,
  contentType,
}: {
  service: Parameters<typeof ContentTypeForm>[0]["service"];
  fieldPrefix?: string;
  contentType?: ContentType;
}) {
  const prefix = fieldPrefix || "details";
  const [activeStep, setActiveStep] = useState(0);
  const cubeIntegrations = service.integrations.filter(
    ({ provide }) => provide === "CUBE"
  );
  const smsIntegrations = service.integrations.filter(
    ({ provide }) => provide === "SMS"
  );

  const [smsContentTypeDetails, setSmsContentTypeDetails] = useState<
    Partial<SMSContentTypeDetail> | undefined
  >(undefined);

  const methods = useFormContext();
  const { reset, control, register, setValue } = methods;

  const fetchColumns = async (cubeIntegrationId?: string) => {
    const cubeIntegration = cubeIntegrations.find(
      ({ id }) => id === cubeIntegrationId
    );
    if (!cubeIntegration) return;

    return await describeTable({
      details: cubeIntegration?.provider?.details,
      cubeSql: extractValue({
        object: cubeIntegration?.details,
        paths: ["SQL"],
      }) as string,
    });
  };
  useEffect(() => {
    const smsContentTypeDetails = toSmsContentTypeDetails(contentType?.details);
    if (!smsContentTypeDetails) return;

    setSmsContentTypeDetails(smsContentTypeDetails);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType]);

  useEffect(() => {
    reset({ [prefix]: smsContentTypeDetails });
  }, [prefix, reset, smsContentTypeDetails]);

  useEffect(() => {
    fetchColumns(smsContentTypeDetails?.cubeIntegrationId)
      .then((_columns) => {
        const columns = _columns as {
          column_name: string;
          column_type: string;
        }[];
        setSmsContentTypeDetails((prev) => {
          return { ...prev, columns };
        });
      })
      .catch((err) => console.log(err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [smsContentTypeDetails?.cubeIntegrationId]);

  // const handleCubeIntegrationChange = (cubeIntegrationId: string) => {
  //   const cubeIntegration = cubeIntegrations.find(
  //     ({ id }) => id === cubeIntegrationId
  //   );
  //   setSmsContentTypeDetails((prev) => {
  //     return { ...prev, cubeIntegrationId: cubeIntegration?.id };
  //   });
  // };
  const handleSmsIntegrationChange = (smsIntegrationId: string) => {
    const smsIntegration = smsIntegrations.find(
      ({ id }) => id === smsIntegrationId
    );
    const cubeIntegrationId = extractValue({
      object: smsIntegration?.details,
      paths: ["cubeIntegrationId"],
    }) as string | undefined;

    setSmsContentTypeDetails((prev) => {
      return {
        ...prev,
        smsIntegrationId: smsIntegration?.id,
        cubeIntegrationId,
      };
    });
  };

  const handleTemplateChange = (newTemplate: string) => {
    setSmsContentTypeDetails((prev) => {
      return { ...prev, template: toPlainText(newTemplate) };
    });
  };
  const handleFromChange = (newFrom: string) => {
    setSmsContentTypeDetails((prev) => {
      return { ...prev, from: newFrom };
    });
  };
  const handleToColumnChange = (newToColumn: string) => {
    setSmsContentTypeDetails((prev) => {
      return { ...prev, toColumn: newToColumn };
    });
  };

  const steps = [
    {
      label: "Select Integrations",
      description: `SMS contentType require a cubeIntegration to substitute template 
      variables and smsIntegration to actually send sms`,
      component: (
        <>
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                SMS Integration
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <select
                  {...register(`${prefix}.smsIntegrationId`)}
                  onChange={(e) => handleSmsIntegrationChange(e.target.value)}
                  // value={smsIntegration?.id}
                >
                  <option value="">Please choose</option>
                  {smsIntegrations.map(({ name, id }) => {
                    return (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </dd>
            </div>
          </dl>
        </>
      ),
    },
    {
      label: "Configure Message Text",
      description: `To send message, receiver and text must be configured. note that
                Mustache template can be used in text.`,
      component: (
        <>
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                <h3>Text</h3>
                <span>
                  Support{" "}
                  <a
                    className="text-blue-400"
                    href="https://mustache.github.io/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Mustache
                  </a>{" "}
                  template.
                  <span className="font-bold text-blue-400">type {"'{'"}</span>
                  to see possible template variables.
                </span>
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <Controller
                  control={control}
                  name={`${prefix}.text`}
                  render={({}) => (
                    <MentionsInput
                      value={toPlainText(smsContentTypeDetails?.template || "")}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      className="focus:shadow-outline h-full w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                      rows={10}
                    >
                      <Mention
                        trigger="{"
                        data={(smsContentTypeDetails?.columns || []).map(
                          ({ column_name }) => {
                            return {
                              id: `{{${column_name}}}`,
                              display: `{{${column_name}}}`,
                            };
                          }
                        )}
                      />
                    </MentionsInput>
                  )}
                />
              </dd>
            </div>

            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                <h3>From</h3>
                <p>This phone_number will be used as sender for SMS</p>
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <input
                  className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                  {...register(`${prefix}.from`)}
                  value={smsContentTypeDetails?.from}
                  onChange={(e) => handleFromChange(e.target.value)}
                />
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                <h3>To Column</h3>
                <p>Cube column that will be used</p>
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <select
                  {...register(`${prefix}.toColumn`)}
                  value={smsContentTypeDetails?.toColumn}
                  onChange={(e) => handleToColumnChange(e.target.value)}
                >
                  <option value="">Please choose</option>
                  {(smsContentTypeDetails?.columns || []).map(
                    ({ column_name }) => {
                      return (
                        <option key={column_name} value={column_name}>
                          {column_name}
                        </option>
                      );
                    }
                  )}
                </select>
              </dd>
            </div>
          </dl>
        </>
      ),
    },
    {
      label: "Test",
      description: `Select test receiver, see substituted text, then invoke test send`,
      component: (
        <SMSContentValuesForm
          contentTypeDetails={smsContentTypeDetails}
          contentValues={undefined}
          service={service}
          fieldPrefix={prefix}
          setValue={(key: string, value: unknown) => {
            console.log(`${prefix}.${key}`, value);
            setValue(`${prefix}.${key}`, value);
          }}
        />
      ),
    },
  ];
  return (
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
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {/* {steps[activeStep]?.label} */}
            </h3>
            {/* <p>{steps[activeStep]?.description}</p> */}
          </div>
          <div className="border-t border-gray-200">
            {steps[activeStep]?.component}
          </div>
        </div>
      </Grid>
    </Grid>
  );
}

export default SMSContentTypeDetailsBuilder;
