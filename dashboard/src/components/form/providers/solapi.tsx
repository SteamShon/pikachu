import axios from "axios";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

import Badge from "../../common/Badge";
import type { ProviderSchemaType } from "../../schema/provider";
import { extractValue } from "../../../utils/json";
import type { Prisma } from "@prisma/client";
import { createHmac } from "crypto";

function Solapi() {
  const [checked, setChecked] = useState<boolean | undefined>(undefined);
  const methods = useFormContext<ProviderSchemaType>();
  const { register, watch, setValue } = methods;

  const validate = async () => {
    const provider = watch();
    try {
      const result = await axios.post(`/api/provider/solapi`, {
        provider,
        method: "getMessageList",
      });
      if (result.status === 200) {
        setValue("status", "PUBLISHED");
      }
      setChecked(result.status === 200);
    } catch (error) {
      setChecked(false);
    }
  };
  const generateHeaders = () => {
    const details = watch("details") as Prisma.JsonObject;
    const now = new Date().toISOString();

    const genRanHex = (size: number) =>
      [...Array(size)]
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("");
    const salt = genRanHex(64);
    const message = now + salt;
    const apiKey = extractValue({
      object: details,
      paths: ["apiKey"],
    }) as string | undefined;
    const apiSecret = extractValue({
      object: details,
      paths: ["apiSecret"],
    }) as string | undefined;
    if (!apiKey || !apiSecret) return;

    const signature = createHmac("sha256", apiSecret)
      .update(message)
      .digest("hex");

    const headers = {
      Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${now}, salt=${salt}, signature=${signature}`,
    };
    setValue(`details.headers`, JSON.stringify(headers, null, 2));
  };
  return (
    <>
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          {/* <h3 className="text-lg font-medium leading-6 text-gray-900">
          {channel?.type} {channel?.provider?.name} Detail Builder.
        </h3> */}
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">API Key</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <input
                  className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                  {...register("details.apiKey")}
                />
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">API Secret</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <input
                  className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                  {...register("details.apiSecret")}
                />
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Headers
                <button
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                  type="button"
                  onClick={() => generateHeaders()}
                >
                  Generate
                </button>
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <textarea
                  className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                  rows={10}
                  {...register(`details.headers`)}
                />
              </dd>
            </div>
          </dl>
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
    </>
  );
}
export default Solapi;
