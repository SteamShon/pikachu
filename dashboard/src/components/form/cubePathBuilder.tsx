import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import type { CubeConfig } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import type { TreeNode } from "../../utils/aws";
import { listFoldersRecursively, loadS3, objectsToTree } from "../../utils/aws";
import { fetchParquetSchema, loadDuckDB } from "../../utils/duckdb";
import type { DatasetSchemaType } from "../schema/dataset";
import DatasetTargetBuilder from "./datasetTargetBuilder";

function CubePathBuilder({
  cubeConfig,
  onChange,
}: {
  cubeConfig: CubeConfig;
  onChange: (input: DatasetSchemaType) => void;
}) {
  const [db, setDB] = useState<AsyncDuckDB | undefined>(undefined);

  const [buckets, setBuckets] = useState<string[]>([]);
  const [bucket, setBucket] = useState<string | undefined>(undefined);

  const [paths, setPaths] = useState<string[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<string[] | undefined>(
    undefined
  );
  const [columns, setColumns] = useState<string[]>([]);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [open, setOpen] = useState(false);
  const loading = bucket !== undefined && open && paths.length === 0;

  const { control, register, setValue, handleSubmit } =
    useForm<DatasetSchemaType>({
      //resolver: zodResolver(datasetSchema),
    });

  const { fields, append, remove } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormContext)
    name: "targets", // unique name for your Field Array
  });

  useEffect(() => {
    (async () => {
      // const s3 = loadS3(cubeConfig);
      // const fetched = listBuckets({ s3 });
      const fetched = ["pikachu-dev"];
      console.log(cubeConfig);

      setBuckets(fetched);
    })();
  }, [cubeConfig]);

  useEffect(() => {
    if (!open) return;
    if (bucket) {
      loadPaths(bucket);
    }
  }, [cubeConfig, open, bucket]);

  const loadPaths = useMemo(
    () => async (bucketName: string, prefix?: string) => {
      const s3 = loadS3(cubeConfig);
      const folders = await listFoldersRecursively({
        s3,
        bucketName: bucketName,
        prefix,
      });

      const newPaths = [
        ...new Set(folders.map((p) => `s3://${bucketName}/${p.Key}`)),
      ];

      setTree(objectsToTree({ paths: folders }));
      setPaths(newPaths);
    },
    [cubeConfig]
  );
  const loadMetadata = useMemo(
    () => async (path: string) => {
      const duckDB = db ? db : await loadDuckDB(cubeConfig);
      if (!duckDB) {
        return;
      }
      setDB(duckDB);
      const rows = await fetchParquetSchema(duckDB, path);

      setColumns(rows.map((row) => String(row.name)));
    },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cubeConfig]
  );
  return (
    <form
      onSubmit={handleSubmit((data) => console.log(data))}
      id="cubePathConfig-form"
    >
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Dataset
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Source</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <div className="border-t border-gray-200">
                  <dl>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        S3 Buckets
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                        <select
                          onChange={(e) => loadPaths(e.target.value)}
                          value={bucket}
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
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        S3 Paths
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                        <Autocomplete
                          id="path-selector"
                          fullWidth
                          open={open}
                          onOpen={() => {
                            setOpen(true);
                          }}
                          onClose={() => {
                            setOpen(false);
                          }}
                          isOptionEqualToValue={(option, value) =>
                            option === value
                          }
                          getOptionLabel={(option) => option}
                          options={paths}
                          loading={loading}
                          multiple
                          autoComplete
                          includeInputInList
                          filterSelectedOptions
                          //value={selectedPaths}
                          // onInputChange={(_event, newInputValue) => {
                          //   setInputValue(newInputValue);
                          // }}
                          onChange={(_e, vs: string[], reason) => {
                            vs.forEach((path, i) => {
                              if (!path.endsWith(".parquet")) return;

                              setValue(`source.files.${i}`, path);
                            });
                            if (vs[0]) {
                              loadMetadata(vs[0]);
                            }
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="S3 Paths"
                              fullWidth
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <>
                                    {loading ? (
                                      <CircularProgress
                                        color="inherit"
                                        size={20}
                                      />
                                    ) : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
                              }}
                            />
                          )}
                        />
                      </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Alias
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                        <input
                          className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                          {...register("source.alias")}
                        />
                      </dd>
                    </div>
                  </dl>
                </div>
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Targets </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <button
                  type="button"
                  onClick={(e) =>
                    append({
                      target: {
                        files: [],
                        alias: "",
                      },
                      conditions: [],
                    })
                  }
                >
                  Add
                </button>
                {fields.map((field, index) => (
                  <DatasetTargetBuilder
                    key={field.id}
                    cubeConfig={cubeConfig}
                    index={index}
                    setValue={setValue}
                    register={register}
                    remove={remove}
                    control={control}
                    sourceColumns={columns}
                  />
                ))}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
        <button>Submit</button>
      </div>
    </form>
  );
}
export default CubePathBuilder;
