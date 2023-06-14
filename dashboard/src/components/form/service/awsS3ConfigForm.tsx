import { useFieldArray, useFormContext } from "react-hook-form";

function AWSS3ConfigForm({ name }: { name: string }) {
  const { register, control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "buckets",
  });

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
              {...register(`${name}.s3Region`)}
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
              {...register(`${name}.s3AccessKeyId`)}
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
              {...register(`${name}.s3SecretAccessKey`)}
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
              {...register(`${name}.s3Buckets`)}
            />

            <span className="absolute left-3 top-3 -translate-y-1/2 text-xs text-gray-700 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs">
              s3Buckets
            </span>
          </label>
        </div>
      </div>
    </>
  );
}
export default AWSS3ConfigForm;
