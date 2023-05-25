import { useFormContext } from "react-hook-form";
import type { ProviderSchemaType } from "../../schema/provider";
import type ChannelForm from "../channelForm";
import axios from "axios";
import { extractValue } from "../../../utils/json";
import { createHmac } from "crypto";
import { ChannelSchemaType } from "../../schema/channel";
import { useState } from "react";
function Solapi({
  channel,
}: {
  channel: Parameters<typeof ChannelForm>[0]["initialData"];
}) {
  const [response, setResponse] = useState<
    | { data: Record<string, unknown>[]; status: number; statusText: string }
    | undefined
  >(undefined);
  const methods = useFormContext<ChannelSchemaType>();
  const { register, watch } = methods;

  const validate = async () => {
    const provider = watch("provider");
    const result = await axios.post(`/api/provider/solapi`, {
      provider,
    });

    setResponse({
      status: result.status,
      statusText: result.statusText,
      data: result.data,
    });
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
                  {...register("provider.details.apiKey")}
                />
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">API Secret</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <input
                  className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                  {...register("provider.details.apiSecret")}
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
            Validate
          </button>
        </div>
      </div>
      <div className="w-full bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
        {response && JSON.stringify(response)}
      </div>
    </>
  );
}
export default Solapi;
