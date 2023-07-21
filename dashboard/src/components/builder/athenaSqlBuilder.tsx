import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Autocomplete,
  Button,
  CircularProgress,
  TextField,
} from "@mui/material";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useFieldArray } from "react-hook-form";

import {
  fetchParquetSchema,
  listFoldersRecursively,
  loadS3,
  partitionBucketPrefix,
  extractS3Buckets,
} from "../../utils/awsS3DuckDB";
import type { DatasetSchemaType } from "../schema/dataset";
import JoinConditionBuilder from "./joinConditionBuilder";
import type { TableMetadata } from "./sqlBuilder";
import type { Prisma, Provider } from "@prisma/client";
import {
  executeAthenaQuery,
  parseAWSConfig,
  parseAwsCredential,
  runAthenaQuery,
} from "../../utils/awsAthena";

function AthenaSqlBuilder({
  provider,
  initialData,
  index,
  methods,
  tableColumns,
  setTableColumns,
}: {
  provider?: Provider;
  index: number;
  initialData?: DatasetSchemaType;
  methods: UseFormReturn<DatasetSchemaType, unknown>;
  tableColumns: TableMetadata;
  setTableColumns: Dispatch<SetStateAction<TableMetadata>>;
}) {
  console.log(provider);

  const [database, setDatabase] = useState<string | undefined>(undefined);
  const [databases, setDatabases] = useState<string[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const loading = database !== undefined && open && tables.length === 0;

  const { control, setValue, watch } = methods;
  const { fields, append, remove } = useFieldArray({
    control,
    name: `tables.${index}.conditions`,
  });
  console.log(watch());
  const loadTables = useMemo(
    () => async (database: string) => {
      const query = `show tables in ${database}`;
      const rows = await runAthenaQuery({ details: provider?.details, query });
      console.log(rows);
      setTables((rows || []).map((row) => row.tab_name as string));
    },
    [provider?.details]
  );
  const loadMetadata = useMemo(
    () => async (table: string) => {
      const query = `describe ${table}`;
      const rows = await runAthenaQuery({ details: provider?.details, query });
      console.log(rows);
      const columns = (rows || []).map((row) => String(row.col_name));
      setTableColumns((prev) => {
        prev[`${index}`] = { columns };
        return prev;
      });
    },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider?.details]
  );

  const defaultValue = {
    sourceColumn: "",
    targetColumn: "",
    sourceTable: "-1",
  };

  useEffect(() => {
    // setDatabase(getBucket());
    const files = initialData?.tables?.[index]?.files;
    if (!files || !files[0]) return;

    loadMetadata(files[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.tables, index]);
  const handleDatabaseChange = (database: string) => {
    setDatabase(database);
    loadTables(database);
  };
  return (
    <div className="border-t border-gray-200">
      <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt className="text-sm font-medium text-gray-500">Database</dt>
        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
          <select
            onChange={(e) => handleDatabaseChange(e.target.value)}
            value={database}
          >
            <option value="">Please choose</option>
            {["default", "test"].map((database) => {
              return (
                <option key={database} value={database}>
                  {database}
                </option>
              );
            })}
          </select>
        </dd>
      </div>
      <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt className="text-sm font-medium text-gray-500">Tables</dt>
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
            options={tables}
            loading={loading}
            defaultValue={initialData?.tables[index]?.files}
            multiple
            autoComplete
            includeInputInList
            filterSelectedOptions
            onChange={(_e, vs: string[]) => {
              console.log(vs);
              vs.forEach((path, j) => {
                // if (!path.endsWith(".parquet")) return;

                setValue(`tables.${index}.files.${j}`, path);
              });
              if (vs[0]) {
                loadMetadata(vs[0]);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tables"
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
            <h4>Conditions </h4>
          </dt>
          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
            {fields.length > 0 ? (
              <div className="grid grid-cols-4 gap-4 border-t border-gray-200">
                <div>Source Table</div>
                <div>Sourec Coulmn</div>
                <div>Column</div>
                <div></div>
              </div>
            ) : null}
            {fields.map((field, conditionIndex) => {
              return (
                <div
                  key={field.id}
                  className="grid grid-cols-4 gap-4 border-t border-gray-200"
                >
                  <JoinConditionBuilder
                    tableColumns={tableColumns}
                    targetIndex={index}
                    conditionIndex={conditionIndex}
                    methods={methods}
                    initialData={
                      initialData?.tables?.[index]?.conditions?.[conditionIndex]
                    }
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => remove(conditionIndex)}
                      startIcon={<DeleteIcon />}
                    />
                  </div>
                </div>
              );
            })}
            <div className="border-t border-gray-200">
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    append(defaultValue);
                  }}
                  startIcon={<AddCircleOutlineIcon />}
                >
                  Add Condition
                </Button>
              </div>
            </div>
          </dd>
        </div>
      )}
    </div>
  );
}
export default AthenaSqlBuilder;
