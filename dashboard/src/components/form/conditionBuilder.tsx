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
import type { DatasetSchemaType } from "../schema/dataset";
import DeleteIcon from "@mui/icons-material/Delete";
import { fetchParquetSchema, loadDuckDB } from "../../utils/duckdb";
import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import { unknown } from "zod";
function ConditionBuilder({
  sourceOptions,
  targetOptions,
}: {
  sourceOptions: string[];
  targetOptions: string[];
}) {
  return (
    <div className="border-t border-gray-200">
      <dl>
        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt className="text-sm font-medium text-gray-500">
            <select>
              <option value="">Please choose</option>
              {sourceOptions.map((option) => {
                return (
                  <option key={option} value={option}>
                    {option}
                  </option>
                );
              })}
            </select>
          </dt>
          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
            <select>
              <option value="">Please choose</option>
              {targetOptions.map((option) => {
                return (
                  <option key={option} value={option}>
                    {option}
                  </option>
                );
              })}
            </select>
          </dd>
        </div>
      </dl>
    </div>
  );
}
export default ConditionBuilder;
