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
  extractS3Region,
} from "../../utils/awsS3DuckDB";
import type { DatasetSchemaType } from "../schema/dataset";
import JoinConditionBuilder from "./joinConditionBuilder";
import type { TableMetadata } from "./sqlBuilder";
import type { Prisma } from "@prisma/client";
import { executeAthenaQuery, parseAwsCredential } from "../../utils/awsAthena";

function AthenaSqlBuilder({
  details,
  initialData,
  index,
  methods,
  tableColumns,
  setTableColumns,
}: {
  details?: Prisma.JsonValue;
  index: number;
  initialData?: DatasetSchemaType;
  methods: UseFormReturn<DatasetSchemaType, unknown>;
  tableColumns: TableMetadata;
  setTableColumns: Dispatch<SetStateAction<TableMetadata>>;
}) {
  console.log(details);

  const loadTables = useMemo(
    () => async (catalog: string, database: string) => {
      const credentials = parseAwsCredential(details);
      const region = extractS3Region(details);
      if (!credentials || !region) return;

      const tables = await executeAthenaQuery({
        config: { region, credentials },
        query: `SHOW TABLES`,
        database,
        catalog,
      });
      console.log(tables);
    },
    [details]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadTables("AwsDataCatalog", "default")
      .then((res) => console.log(res))
      .catch((e) => console.log(e));
  }, [initialData?.tables, index]);

  return (
    // <div className="border-t border-gray-200">
    //   <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
    //     <dt className="text-sm font-medium text-gray-500">Tables</dt>
    //     <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0"></dd>
    //   </div>
    // </div>
    <>Hi</>
  );
}
export default AthenaSqlBuilder;
