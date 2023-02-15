import AddCircleOutline from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import { Button } from "@mui/material";
import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import type { DatasetSchemaType } from "../schema/dataset";
import type { TableMetadata } from "./sqlBuilder";
function JoinConditionBuilder({
  tableColumns,
  targetIndex,
  conditionIndex,
  methods,
  initialData,
}: {
  tableColumns: TableMetadata;
  targetIndex: number;
  conditionIndex: number;
  methods: UseFormReturn<DatasetSchemaType, unknown>;
  initialData?: DatasetSchemaType;
}) {
  const [selectedTableIndex, setSelectedTableIndex] = useState<string>("-1");
  const { setValue } = methods;
  {
    /* <select
        onChange={(e) =>
          setSelectedTable(e.target.value);
        }
      >
        <option value="">Please select</option>
        {Object.keys(tableColumns).map((index) => {
          return <option value={index}>{index}</option>
        })}
      </select>
      <select
        onChange={(e) =>
          // setValue(
          //   `tables.${targetIndex}.conditions.${conditionIndex}.source`,
          //   e.target.value
          // )
        }
      >
        <option value="">Please select</option>
        {sourceOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <select
        onChange={(e) =>
          // setValue(
          //   `targets.${targetIndex}.conditions.${conditionIndex}.target`,
          //   e.target.value
          // )
        }
      >
        <option value="">Please select</option>
        {targetOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <Button
        type="button"
        onClick={() => remove(conditionIndex)}
        startIcon={<DeleteIcon />}
      ></Button> */
  }
  return (
    <>
      <select
        onChange={(e) => {
          setSelectedTableIndex(e.target.value);
          setValue(
            `tables.${targetIndex}.conditions.${conditionIndex}.sourceTable`,
            e.target.value
          );
        }}
      >
        <option value="">Please select</option>
        {Object.keys(tableColumns).map((index) => {
          return (
            <option key={index} value={index}>
              {index}
            </option>
          );
        })}
      </select>
      <select
        onChange={(e) => {
          setValue(
            `tables.${targetIndex}.conditions.${conditionIndex}.source`,
            e.target.value
          );
        }}
      >
        <option value="">Please select</option>
        {tableColumns[selectedTableIndex]?.columns.map((column) => {
          return (
            <option key={column} value={column}>
              {column}
            </option>
          );
        })}
      </select>
      <select
        onChange={(e) => {
          setValue(
            `tables.${targetIndex}.conditions.${conditionIndex}.target`,
            e.target.value
          );
        }}
      >
        <option value="">Please select</option>
        {tableColumns[targetIndex]?.columns.map((column) => {
          return (
            <option key={column} value={column}>
              {column}
            </option>
          );
        })}
      </select>
    </>
  );
}
export default JoinConditionBuilder;
