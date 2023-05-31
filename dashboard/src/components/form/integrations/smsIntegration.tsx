import {
  materialCells,
  materialRenderers,
} from "@jsonforms/material-renderers";
import { JsonForms } from "@jsonforms/react";
import JsonSchemaEditor from "@optum/json-schema-editor";
import type { ContentType, ContentTypeInfo, Provider } from "@prisma/client";
import axios from "axios";
import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { extractValue, jsonParseWithFallback } from "../../../utils/json";
import Badge from "../../common/Badge";
import type IntegrationForm from "../integrationForm";
import ContentTypeInfoBuilder from "../contentTypeInfoBuilder";
import Link from "next/link";

function SmsIntegration({
  service,
  provider,
  name,
}: {
  service: Parameters<typeof IntegrationForm>[0]["service"];
  provider: Provider;
  name: string;
}) {
  //TODO: only SMS provide contentType should be filtered
  const contentTypes = service.contentTypes.filter(
    ({ type }) => type === "SMS"
  );
  const [contentType, setContentType] = useState<
    typeof contentTypes[0] | undefined
  >(undefined);

  const [checked, setChecked] = useState<boolean | undefined>(undefined);

  const methods = useFormContext();
  const { register, getValues, setValue, control } = methods;
  const handleContentTypeChange = (contentTypeId: string) => {
    const contentType = contentTypes.find(({ id }) => id === contentTypeId);
    setContentType(contentType);
  };
  const validate = async () => {
    const values = getValues(`contentTypeInfo.details.defaultValues`) as
      | string
      | undefined;
    const payload = jsonParseWithFallback(values);

    const from = payload.from as string;
    const text = payload.text as string;
    const tos = payload.tos as string[];

    const messages = {
      messages: tos.map((to) => {
        return { to, from, text };
      }),
    };
    try {
      const result = await axios.post(`/api/integration/solapi`, {
        payload: messages,
        method: "sendMessages",
        provider,
      });
      if (result.status === 200) {
        setValue("status", "PUBLISHED");
      }
      setChecked(result.status === 200);
    } catch (error) {
      setChecked(false);
    }
  };

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        {contentTypes.length === 0 ? (
          <>
            <p>
              Please create ContentType for SMS Send API
              <Link href={`/service/${service.id}/dashboard?step=contentType`}>
                <span className="inline-flex w-full justify-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm">
                  Go to ContentType
                </span>
              </Link>
            </p>
          </>
        ) : (
          <label
            htmlFor="contentType"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700">
              ContentType
            </span>
            <select
              id="contentType"
              className="peer h-8 w-full border-none bg-transparent p-0 placeholder-transparent focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              onChange={(e) => handleContentTypeChange(e.target.value)}
            >
              <option value="">Please select</option>
              {contentTypes.map(({ contentTypeInfo, ...contentType }) => {
                return (
                  <option key={contentType.id} value={contentType.id}>
                    {contentType.name}
                  </option>
                );
              })}
            </select>
          </label>
        )}
      </div>
      <div>
        {contentType && <ContentTypeInfoBuilder contentType={contentType} />}
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
      </div>
    </div>
  );
}

export default SmsIntegration;
