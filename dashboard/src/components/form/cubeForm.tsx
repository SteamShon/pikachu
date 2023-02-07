import { zodResolver } from "@hookform/resolvers/zod";
import type { Cube, CubeConfig } from "@prisma/client";
import type { Object as S3Object } from "aws-sdk/clients/s3";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { listFoldersRecursively, loadS3 } from "../../utils/aws";
import CustomLoadingButton from "../common/CustomLoadingButton";
import type { CubeWithCubeConfigSchemaType } from "../schema/cube";
import { cubeWithCubeConfigSchema } from "../schema/cube";
function CubeForm({
  cubeConfigs,
  initialData,
  onSubmit,
}: {
  cubeConfigs: CubeConfig[];
  initialData?: Cube;
  onSubmit: (input: CubeWithCubeConfigSchemaType) => void;
}) {
  const [cubeConfig, setCubeConfig] = useState<CubeConfig | undefined>(
    undefined
  );
  const [buckets, setBuckets] = useState<string[]>([]);
  const [bucket, setBucket] = useState<string | undefined>(undefined);
  const [s3Paths, setS3Paths] = useState<S3Object[]>([]);
  const methods = useForm<CubeWithCubeConfigSchemaType>({
    resolver: zodResolver(cubeWithCubeConfigSchema),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  useEffect(() => {
    reset({
      ...(initialData ? initialData : {}),
    });
    const initialCubeConfig = cubeConfigs.find(
      (cubeConfig) => cubeConfig.id === initialData?.cubeConfigId
    );
    setCubeConfig(initialCubeConfig);
    setBuckets(["pikachu-dev"]);
    if (initialData) {
      const tokens = initialData.s3Path.split("/");
      const currentBucket = tokens[2];

      setBucket(currentBucket);
      const prefix = tokens.slice(3, tokens.length).join("/");
      if (initialCubeConfig && currentBucket) {
        const s3 = loadS3(initialCubeConfig);
        listFoldersRecursively({
          s3,
          bucketName: currentBucket,
          prefix,
        }).then((currentPaths) => setS3Paths(currentPaths));
      }
    }
  }, [cubeConfigs, initialData, reset]);

  const handleBucketSelect = async (value: string) => {
    setBucket(value);
    if (!cubeConfig) return;

    const s3 = loadS3(cubeConfig);
    const folders = await listFoldersRecursively({
      s3,
      bucketName: value,
    });

    setS3Paths(folders);
  };
  const handleCubeConfigSelect = async (value: string) => {
    const selected = cubeConfigs.find((cubeConfig) => cubeConfig.id === value);

    if (selected) {
      // const s3 = loadS3(selected);

      // const bks = await listBuckets({ s3 });

      setBuckets(["pikachu-dev"]);
    }

    setCubeConfig(selected);
  };
  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} id="cubeConfig-form">
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Cube
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  CubeConfig
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("cubeConfigId")}
                    defaultValue={initialData?.cubeConfigId || undefined}
                    disabled={initialData ? true : false}
                    onChange={(e) => handleCubeConfigSelect(e.target.value)}
                  >
                    <option value="">Please choose</option>
                    {cubeConfigs.map((cubeConfig) => {
                      return (
                        <option key={cubeConfig.id} value={cubeConfig.id}>
                          {cubeConfig.name}
                        </option>
                      );
                    })}
                  </select>
                  {errors.name && <p role="alert">{errors.name?.message}</p>}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <input
                    className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                    defaultValue={initialData?.name}
                    {...register("name")}
                  />
                  {errors.name && <p role="alert">{errors.name?.message}</p>}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Description
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <textarea
                    className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                    defaultValue={initialData?.description || undefined}
                    rows={3}
                    {...register("description")}
                  />
                  {errors.description && (
                    <p role="alert">{errors.description?.message}</p>
                  )}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("status")}
                    defaultValue={initialData?.status || "CREATED"}
                  >
                    <option value="">Please choose</option>
                    <option value="CREATED">CREATED</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                  {errors.status && (
                    <p role="alert">{errors.status?.message}</p>
                  )}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  S3 Buckets
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select onChange={(e) => handleBucketSelect(e.target.value)}>
                    <option value="">Please choose</option>
                    {buckets.map((bucket, idx) => {
                      return (
                        <option key={idx} value={bucket}>
                          {bucket}
                        </option>
                      );
                    })}
                  </select>

                  {errors.s3Path && (
                    <p role="alert">{errors.s3Path?.message}</p>
                  )}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">s3Path</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("s3Path")}
                    defaultValue={initialData?.s3Path}
                  >
                    <option value="">Please choose</option>
                    {s3Paths.map((s3Path, idx) => {
                      return (
                        <option key={idx} value={s3Path.Key}>
                          {s3Path.Key}
                        </option>
                      );
                    })}
                  </select>

                  {errors.s3Path && (
                    <p role="alert">{errors.s3Path?.message}</p>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <CustomLoadingButton
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
          />
        </div>
      </form>
    </FormProvider>
  );
}

export default CubeForm;
