import axios from "axios";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { executeQuery } from "../../../utils/awsS3DuckDB";
import { extractValue } from "../../../utils/json";
import type { SMSContentTypeDetail } from "../../../utils/smsContentType";
import { toPlainText, extractVariables, substitute } from "../../../utils/text";
import type ContentPreview from "../../builder/contentPreview";
import Badge from "../../common/Badge";
import MyLoadingButton from "../../common/MyLoadingButton";

function SMSContentValuesForm({
  contentTypeDetails,
  contentValues,
  service,
  fieldPrefix,
  setValue,
}: {
  service: Parameters<typeof ContentPreview>[0]["service"];
  contentTypeDetails?: Partial<SMSContentTypeDetail>;
  contentValues?: { [x: string]: unknown };
  fieldPrefix?: string;
  setValue: (key: string, value: unknown) => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const prefix = fieldPrefix || "details";
  const [template, setTemplate] = useState<string | undefined>(undefined);
  const [values, setValues] = useState<Record<string, string | undefined>>({});

  const [tos, setTos] = useState<string[] | undefined>(undefined);

  const [response, setResponse] = useState<
    | { data: Record<string, unknown>[]; status: number; statusText: string }
    | undefined
  >(undefined);

  useEffect(() => {
    setTemplate(toPlainText(contentTypeDetails?.template || ""));

    if (contentValues && Object.keys(contentValues).length > 0) {
      // use provided content's value.
      const values = contentValues as Record<string, string | undefined>;
      setValues(values);
    } else {
      // intialize values from contentType
      const variables = extractVariables(contentTypeDetails?.template);
      const values = (variables || []).reduce((prev, cur) => {
        prev[cur] = undefined;
        return prev;
      }, {} as Record<string, string | undefined>);
      setValues(values);
    }
  }, [contentTypeDetails, contentValues, setValue, prefix]);

  useEffect(() => {
    if (setValue) {
      Object.entries(values).forEach(([k, v]) => {
        console.log(k, v);
        setValue(k, v);
      });
    }
  }, [setValue, values]);

  const handleToChange = (text: string) => {
    const tos = text.split("\n");
    setTos(tos);
  };

  const validate = async () => {
    const from = contentTypeDetails?.from;

    if (!from || !template) {
      enqueueSnackbar(`from or text is missing: ${from}, ${template}`, {
        variant: "error",
      });
      return;
    }

    const messages = {
      messages: (tos || []).map((to) => {
        return { to, from, text: template };
      }),
    };

    const smsIntegration = service.integrations.find(
      ({ id }) => id === contentTypeDetails?.smsIntegrationId
    );
    const request = {
      payload: messages,
      route: "sendMessages",
      providerDetails: smsIntegration?.provider?.details,
      integrationDetails: smsIntegration?.details,
    };

    try {
      const result = await axios.post(`/api/integration/solapi`, request);

      enqueueSnackbar("send message", {
        variant: result.status === 200 ? "success" : "error",
      });
      setResponse({
        status: result.status,
        statusText: result.statusText,
        data: result.data,
      });
    } catch (e) {
      enqueueSnackbar(`send message failed: ${e}`, { variant: "error" });
    }
  };
  const columnExistInCube = (variable: string) => {
    if (!contentTypeDetails) return;

    return (
      contentTypeDetails?.columns?.findIndex(
        ({ column_name }) => column_name === variable
      ) !== -1
    );
  };

  const changeVariableValue = (variable: string, value: string) => {
    const newValues = {
      ...values,
      [variable]: value === "" ? undefined : value,
    };
    setValues(newValues);
    if (!contentTypeDetails?.template) return;

    const transformed = substitute(contentTypeDetails.template, newValues);
    setTemplate(transformed);
  };

  const transformVariables = async () => {
    const cubeIntegration = service.integrations.find(
      ({ id, provide }) =>
        provide === "CUBE" && id === contentTypeDetails?.cubeIntegrationId
    );

    if (!cubeIntegration || !contentTypeDetails?.toColumn) return;

    const toColumn = contentTypeDetails?.toColumn;

    const cubeSql = extractValue({
      object: cubeIntegration?.details,
      paths: ["SQL"],
    }) as string | undefined;

    if (!toColumn || !cubeSql || !tos?.[0]) return;

    const query = `${cubeSql} WHERE ${toColumn} = '${tos[0]}' LIMIT 1`;

    if (!query || !cubeIntegration?.provider?.details) return;

    const result = await executeQuery({
      details: cubeIntegration?.provider?.details,
      query,
    });
    const userInfo = result[0];

    if (setValue) {
      const variables = extractVariables(contentTypeDetails?.template);

      (variables || []).forEach((variable) => {
        const value = columnExistInCube(variable)
          ? (userInfo?.[`${variable}`] as string | undefined)
          : values[variable];
        // if (!value) return;
        setValue(variable, value);
        setValues((prev) => {
          return { ...prev, [variable]: value };
        });
      });
    }

    const substituted = substitute(template || "", userInfo);
    setTemplate(substituted);
  };

  return (
    <>
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            ContentType
          </h3>
          <p className="p-2">
            Enter test phone_numbers in TestTo field. other field is inherited
            from ContentType so they are not editable
          </p>
        </div>

        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Template</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <textarea
                  className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                  rows={10}
                  readOnly
                  value={template}
                />
              </dd>
            </div>
          </dl>
        </div>

        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">From</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <input
                  className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                  value={contentTypeDetails?.from}
                  readOnly
                />
              </dd>
            </div>
          </dl>
        </div>

        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Test To</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <textarea
                  className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                  placeholder={"010-8940-5798\n010-8940-5798"}
                  onChange={(e) => handleToChange(e.target.value)}
                />
              </dd>
            </div>
          </dl>
        </div>

        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Values
          </h3>
        </div>
        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt className="text-sm font-medium text-gray-500">
            <h3 className="text-lg font-medium leading-6 text-red-900">
              User Provide Variables{" "}
              <Badge label={`Required`} variant={"error"} />
            </h3>
          </dt>
          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
            {Object.keys(values)
              ?.filter((v) => !columnExistInCube(v))
              .map((variable) => {
                return (
                  <label
                    key={`${variable}`}
                    htmlFor={`${variable}`}
                    className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
                  >
                    <span className="text-xs font-medium text-gray-700">
                      {variable}
                    </span>
                    <input
                      // {...register(`${prefix}.${variable}`)}
                      className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                      onChange={(e) =>
                        changeVariableValue(variable, e.target.value)
                      }
                      readOnly={columnExistInCube(variable)}
                      value={values[`${variable}`]}
                    />
                  </label>
                );
              })}
          </dd>
        </div>

        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt className="text-sm font-medium text-gray-500">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Cube Variables <Badge label={`Optional`} variant={"success"} />
            </h3>
            <span>This Variables will be overwritten by data in Cube</span>
          </dt>
          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
            {Object.keys(values)
              ?.filter((v) => columnExistInCube(v))
              .map((variable) => {
                return (
                  <label
                    key={`${variable}`}
                    htmlFor={`${variable}`}
                    className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
                  >
                    <span className="text-xs font-medium text-gray-700">
                      {variable}
                    </span>
                    <input
                      className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                      onChange={(e) =>
                        changeVariableValue(variable, e.target.value)
                      }
                      readOnly={columnExistInCube(variable)}
                      value={values[`${variable}`]}
                    />
                  </label>
                );
              })}
          </dd>
        </div>

        <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <MyLoadingButton label="Test Send" onClick={validate} />

          <MyLoadingButton
            label="Transform Variables"
            onClick={transformVariables}
          />
          {(tos === undefined || tos.length === 0) && <p>Enter TestTos</p>}
        </div>

        <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          {response && JSON.stringify(response)}
        </div>
      </div>
    </>
  );
}
export default SMSContentValuesForm;
