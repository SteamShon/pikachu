import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import {
  Autocomplete,
  Button,
  CircularProgress,
  TextField,
} from "@mui/material";
import type { CubeConfig } from "@prisma/client";
import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import { listFoldersRecursively, loadS3 } from "../../utils/aws";
import { fetchParquetSchema, loadDuckDB } from "../../utils/duckdb";
import type { DatasetSchemaType } from "../schema/dataset";
import JoinConditionBuilder from "./joinConditionBuilder";
import type { TableMetadata } from "./sqlBuilder";

function JoinCandidateBuilder({
  cubeConfig,
  initialData,
  index,
  methods,
  tableColumns,
  setTableColumns,
}: {
  cubeConfig: CubeConfig;
  index: number;
  initialData?: DatasetSchemaType;
  methods: UseFormReturn<DatasetSchemaType, unknown>;
  tableColumns: TableMetadata;
  setTableColumns: Dispatch<SetStateAction<TableMetadata>>;
}) {
  const [db, setDB] = useState<AsyncDuckDB | undefined>(undefined);
  const [buckets, setBuckets] = useState<string[]>(["pikachu-dev"]);
  const [bucket, setBucket] = useState<string | undefined>(undefined);
  const [paths, setPaths] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const loading = bucket !== undefined && open && paths.length === 0;

  const { control, setValue } = methods;
  const { fields, append, remove } = useFieldArray({
    control,
    name: `tables.${index}.conditions`,
  });
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
      const columns = rows.map((row) => String(row.name));
      setTableColumns((prev) => {
        prev[`${index}`] = { columns };
        return prev;
      });
    },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cubeConfig]
  );

  const defaultValue = { source: "", target: "", sourceTable: "-1" };

  return (
    <>
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="flex justify-center border-t border-gray-200">
          <h3>Table {index}</h3>
        </div>
        <div className="border-t border-gray-200">
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">S3 Buckets</dt>
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
            <dt className="text-sm font-medium text-gray-500">S3 Paths</dt>
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
                defaultValue={initialData?.tables[index]?.files}
                multiple
                autoComplete
                includeInputInList
                filterSelectedOptions
                onChange={(_e, vs: string[]) => {
                  vs.forEach((path, j) => {
                    if (!path.endsWith(".parquet")) return;

                    setValue(`tables.${index}.files.${j}`, path);
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
          {index === 0 ? (
            <></>
          ) : (
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                <h4>
                  Conditions{" "}
                  <Button
                    type="button"
                    onClick={() => append(defaultValue)}
                    startIcon={<AddCircleOutlineIcon />}
                  />
                </h4>
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {fields.map((field, conditionIndex) => {
                  return (
                    <div key={field.id} className="border-t border-gray-200">
                      <JoinConditionBuilder
                        tableColumns={tableColumns}
                        targetIndex={index}
                        conditionIndex={conditionIndex}
                        methods={methods}
                      />
                      <Button
                        type="button"
                        onClick={() => remove(conditionIndex)}
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })}
              </dd>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
export default JoinCandidateBuilder;
