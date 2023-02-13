import { zodResolver } from "@hookform/resolvers/zod";
import SendIcon from "@mui/icons-material/Send";
import LoadingButton from "@mui/lab/LoadingButton";
import { Button } from "@mui/material";
import type { Cube, CubeConfig } from "@prisma/client";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
  listFoldersRecursively,
  loadS3,
  partitionBucketPrefix,
} from "../../utils/aws";
import { buildJoinSql } from "../../utils/dataset";
import { executeQuery, loadDuckDB } from "../../utils/duckdb";
import CustomLoadingButton from "../common/CustomLoadingButton";
import QueryResultTable from "../common/QueryResultTable";
import type { CubeWithCubeConfigSchemaType } from "../schema/cube";
import { cubeWithCubeConfigSchema } from "../schema/cube";
import type { DatasetSchemaType } from "../schema/dataset";
import CubePathBuilder from "./cubePathBuilder";
function CubeForm({
  cubeConfigs,
  initialData,
  onSubmit,
}: {
  cubeConfigs: CubeConfig[];
  initialData?: Cube;
  onSubmit: (input: CubeWithCubeConfigSchemaType) => void;
}) {
  const [selectedCubeConfig, setSelectedCubeConfig] = useState<
    CubeConfig | undefined
  >(undefined);
  const [buckets, setBuckets] = useState<string[]>([]);
  const [s3Paths, setS3Paths] = useState<string[]>([]);

  const [selectedBucket, setSelectedBucket] = useState<string | undefined>(
    undefined
  );
  const [selectedPath, setSelectedPath] = useState<string | undefined>(
    undefined
  );

  const [dataset, setDataset] = useState<DatasetSchemaType | undefined>(
    undefined
  );
  const [rows, setRows] = useState<{ [x: string]: unknown }[]>([]);
  const [loading, setLoading] = useState(false);
  const [showQueryResult, setShowQueryResult] = useState(false);

  const methods = useForm<CubeWithCubeConfigSchemaType>({
    resolver: zodResolver(cubeWithCubeConfigSchema),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = methods;

  const handleBucketSelect = async (
    cubeConfig?: CubeConfig,
    newBucket?: string
  ) => {
    setSelectedBucket(newBucket);
    if (!cubeConfig || !newBucket) return;

    const s3 = loadS3(cubeConfig);
    const folders = await listFoldersRecursively({
      s3,
      bucketName: newBucket,
    });

    const newPaths = [
      ...new Set(folders.map((p) => `s3://${newBucket}/${p.Key}`)),
    ];
    setS3Paths(newPaths);
    return newPaths;
  };

  const handleCubeConfigSelect = async (newCubeConfigId: string) => {
    const selected = cubeConfigs.find(
      (cubeConfig) => cubeConfig.id === newCubeConfigId
    );

    if (selected) {
      // const s3 = loadS3(selected);

      // const bks = await listBuckets({ s3 });

      setBuckets(["pikachu-dev"]);
    }

    setSelectedCubeConfig(selected);
    return selected;
  };

  const runQuery = () => {
    setLoading(true);
    if (!selectedCubeConfig) return;
    if (!dataset) return;

    (async () => {
      const db = await loadDuckDB(selectedCubeConfig);
      if (!db) return;
      const sql = `${buildJoinSql(dataset)} LIMIT 10`;
      console.log(sql);
      const rows = await executeQuery(db, sql);
      setRows(rows);
      setLoading(false);
      setShowQueryResult(true);
    })();
  };

  useEffect(() => {
    reset({
      ...(initialData ? initialData : {}),
    });
    const initialize = async () => {
      if (initialData) {
        setSelectedPath(initialData.s3Path);
        const { bucket } = partitionBucketPrefix(initialData.s3Path);

        const cubeConfig = await handleCubeConfigSelect(
          initialData?.cubeConfigId
        );
        await handleBucketSelect(cubeConfig, bucket);
      }
    };

    initialize()
      .then(() => console.log("initialized finished"))
      .catch((e) => console.error(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cubeConfigs, initialData, reset]);

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
                    value={selectedCubeConfig?.id}
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
              {/* <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  S3 Buckets
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    onChange={(e) =>
                      handleBucketSelect(selectedCubeConfig, e.target.value)
                    }
                    value={selectedBucket}
                  >
                    <option value="">Please choose</option>
                    {buckets.map((bucket) => {
                      return (
                        <option key={bucket} value={bucket}>
                          {bucket}
                        </option>
                      );
                    })}
                  </select>
                </dd>
              </div> */}
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">SQL</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <textarea
                    className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                    rows={5}
                    {...register("sql")}
                  />
                  {dataset ? (
                    <LoadingButton
                      type="button"
                      variant="contained"
                      loadingPosition="end"
                      endIcon={<SendIcon />}
                      onClick={() => runQuery()}
                      loading={loading}
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      <span>Run Query</span>
                    </LoadingButton>
                  ) : null}
                  <Button onClick={() => setShowQueryResult(!showQueryResult)}>
                    Show Result
                  </Button>
                  {showQueryResult ? <QueryResultTable rows={rows} /> : null}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Query Editor
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {selectedCubeConfig ? (
                    <CubePathBuilder
                      cubeConfig={selectedCubeConfig}
                      onSubmit={(data: DatasetSchemaType) => {
                        setDataset(data);
                        setValue("sql", buildJoinSql(data));
                      }}
                    />
                  ) : null}
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
