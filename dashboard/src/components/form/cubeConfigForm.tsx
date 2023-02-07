import type { CubeConfig, CustomsetInfo } from "@prisma/client";
import { useFormContext } from "react-hook-form";

function CubeConfigForm({ initialData }: { initialData?: CubeConfig }) {
  const { register } = useFormContext();

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">S3 Region</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <select
                {...register("cubeConfig.s3Region")}
                defaultValue={initialData?.s3Region}
              >
                <option value="">Select one</option>
                <option value="ap-northeast-2">ap-northeast-2</option>
              </select>
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">
              s3_access_key_id
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <input
                className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                defaultValue={initialData?.s3AccessKeyId}
                {...register("cubeConfig.s3AccessKeyId")}
              />
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
export default CubeConfigForm;
