import type { CustomsetInfo } from "@prisma/client";
import { useFormContext } from "react-hook-form";

function CustomsetInfoForm({ initialData }: { initialData?: CustomsetInfo }) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">File</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <input
                //type="file"
                className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                defaultValue={initialData?.filePath}
                {...register("customsetInfo.filePath")}
              />
              {errors.customsetInfo && errors.customsetInfo.filePath && (
                <p role="alert">{errors.customsetInfo?.filePath?.message}</p>
              )}
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Config</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <input
                className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                defaultValue={initialData?.config}
                {...register("customsetInfo.config")}
              />
              {errors.customsetInfo && errors.customsetInfo.config && (
                <p role="alert">{errors.customsetInfo?.config?.message}</p>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
export default CustomsetInfoForm;
