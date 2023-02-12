import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Autocomplete,
  Button,
  CircularProgress,
  TextField,
} from "@mui/material";
import type { CubeConfig } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";
import type {
  UseFieldArrayRemove,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { listFoldersRecursively, loadS3 } from "../../utils/aws";
import { fetchParquetSchema, loadDuckDB } from "../../utils/duckdb";
import type { DatasetSchemaType } from "../schema/dataset";
function DatasetTargetBuilder({
  cubeConfig,
  index,
  register,
  setValue,
  remove,
}: {
  cubeConfig: CubeConfig;
  index: number;
  register: UseFormRegister<DatasetSchemaType>;
  setValue: UseFormSetValue<DatasetSchemaType>;
  remove: UseFieldArrayRemove;
}) {
  const [db, setDB] = useState<AsyncDuckDB | undefined>(undefined);
  const [buckets, setBuckets] = useState<string[]>([]);
  const [bucket, setBucket] = useState<string | undefined>(undefined);
  const [paths, setPaths] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const loading = bucket !== undefined && open && paths.length === 0;

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
      setBucket(bucketName);
      const s3 = loadS3(cubeConfig);
      const folders = await listFoldersRecursively({
        s3,
        bucketName: bucketName,
        prefix,
      });

      const newPaths = [
        ...new Set(folders.map((p) => `s3://${bucketName}/${p.Key}`)),
      ];

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

      setMetadata(rows);
    },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cubeConfig]
  );
  return (
    <div className="border-t border-gray-200">
      <dl>
        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt className="text-sm font-medium text-gray-500">Target</dt>
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
                      isOptionEqualToValue={(option, value) => option === value}
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
                        vs.forEach((path, j) => {
                          setValue(`targets.${index}.target.files.${j}`, path);
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
                                  <CircularProgress color="inherit" size={20} />
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
                  <dt className="text-sm font-medium text-gray-500">Alias</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <input
                      className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                      {...register(`targets.${index}.target.alias`)}
                    />
                  </dd>
                </div>
              </dl>
            </div>
          </dd>
        </div>

        <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <Button
            type="button"
            onClick={() => remove(index)}
            startIcon={<DeleteIcon />}
          ></Button>
        </div>
      </dl>
    </div>
  );
}
export default DatasetTargetBuilder;
