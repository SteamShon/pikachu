import axios from "axios";
import { useFieldArray, useFormContext } from "react-hook-form";
import { ProviderSchemaType } from "../../schema/provider";
import { useState } from "react";
import Badge from "../../common/Badge";

function AWSS3DuckDB() {
  const [checked, setChecked] = useState<boolean | undefined>(undefined);
  const methods = useFormContext<ProviderSchemaType>();
  const { register, watch, setValue } = methods;

  const validate = async () => {
    const provider = watch();

    try {
      const result = await axios.post(`/api/provider/awsS3DuckDB`, {
        provider,
        method: "checkConnection",
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
    <>
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">AWS S3 Config</h1>

          <p className="mt-4 text-gray-500">
            Following configurations will be used to access remote AWS S3 files
            for Cube. Cube is basic unit of analysis, defining customer profiles
            and historical behaviors
          </p>
        </div>

        <div className="mx-auto mt-8 mb-0 max-w-md space-y-4">
          <label
            htmlFor="s3Region"
            className="relative block overflow-hidden rounded-md border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <select
              id="s3Region"
              className="peer h-8 w-full border-none bg-transparent p-0 placeholder-transparent focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              {...register(`details.s3Region`)}
            >
              <option value="">Please select</option>
              <option value="ap-northeast-2">ap-northeast-2</option>
            </select>

            <span className="absolute left-3 top-3 -translate-y-1/2 text-xs text-gray-700 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs">
              S3 Region
            </span>
          </label>
          <label
            htmlFor="s3AccessKeyId"
            className="relative block overflow-hidden rounded-md border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <input
              id="s3AccessKeyId"
              placeholder="s3AccessKeyId"
              className="peer h-8 w-full border-none bg-transparent p-0 placeholder-transparent focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              {...register(`details.s3AccessKeyId`)}
            />

            <span className="absolute left-3 top-3 -translate-y-1/2 text-xs text-gray-700 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs">
              s3AccessKeyId
            </span>
          </label>
          <label
            htmlFor="s3SecretAccessKey"
            className="relative block overflow-hidden rounded-md border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <input
              id="s3SecretAccessKey"
              placeholder="s3SecretAccessKey"
              className="peer h-8 w-full border-none bg-transparent p-0 placeholder-transparent focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              {...register(`details.s3SecretAccessKey`)}
            />

            <span className="absolute left-3 top-3 -translate-y-1/2 text-xs text-gray-700 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs">
              s3SecretAccessKey
            </span>
          </label>
          <label
            htmlFor="s3Buckets"
            className="relative block overflow-hidden rounded-md border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <input
              id="s3Buckets"
              placeholder="s3Buckets seperated by ','"
              className="peer h-8 w-full border-none bg-transparent p-0 placeholder-transparent focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              {...register(`details.s3Buckets`)}
            />

            <span className="absolute left-3 top-3 -translate-y-1/2 text-xs text-gray-700 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs">
              s3Buckets
            </span>
          </label>
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
export default AWSS3DuckDB;
