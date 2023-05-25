import { Provider } from "@prisma/client";
import ContentPreview from "./contentPreview";
import { useState } from "react";
import axios from "axios";
import { useFormContext } from "react-hook-form";

function SMSPlayground({
  service,
  values,
}: {
  service: Parameters<typeof ContentPreview>[0]["service"];
  values: Record<string, unknown>;
}) {
  const [provider, setProvider] = useState<Provider | undefined>(undefined);
  const [tos, setTos] = useState<string[]>([]);

  const [response, setResponse] = useState<
    | { data: Record<string, unknown>[]; status: number; statusText: string }
    | undefined
  >(undefined);

  const providers: Provider[] = [];
  service?.channels.forEach((channel) => {
    if (!channel.provider) return;
    providers.push(channel?.provider);
  });

  const validate = async (method: string) => {
    if (tos.length === 0) return;

    const payload = {
      messages: tos.map((t) => {
        return { to: t, from: values.from, text: values.text };
      }),
    };

    const result = await axios.post(`/api/provider/solapi`, {
      provider,
      method,
      payload,
    });

    setResponse({
      status: result.status,
      statusText: result.statusText,
      data: result.data,
    });
  };
  const handleProviderChange = async (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId);
    setProvider(provider);
  };
  return (
    <>
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            SMS Test Playground
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Provider</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <select onChange={(e) => handleProviderChange(e.target.value)}>
                  <option value="">Please select</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">To</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <textarea
                  className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                  placeholder={"010-8940-5798\n010-8940-5798"}
                  onChange={(e) => setTos(e.target.value.split("\n"))}
                />
              </dd>
            </div>
          </dl>
        </div>

        {provider && (
          <>
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                type="button"
                onClick={() => validate("sendMessages")}
              >
                Test
              </button>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              {response && JSON.stringify(response)}
            </div>
          </>
        )}
      </div>
    </>
  );
}
export default SMSPlayground;
