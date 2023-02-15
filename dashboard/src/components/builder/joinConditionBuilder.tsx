import AddCircleOutline from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import { Button } from "@mui/material";
import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import { string } from "zod";
import type { ConditionSchemaType, DatasetSchemaType } from "../schema/dataset";
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
  const [condition, setCondition] = useState<ConditionSchemaType | undefined>(
    undefined
  );
  const [sourceTables, setSourceTables] = useState<string[]>([]);
  const [sourceColumns, setSourceColumns] = useState<string[]>([]);
  const [targetColumns, setTargetColumns] = useState<string[]>([]);

  const { setValue } = methods;

  useEffect(() => {
    const condition =
      initialData?.tables?.[targetIndex]?.conditions?.[conditionIndex];

    console.log("useEffect", condition);
    setCondition(condition);

    setSourceTables(Object.keys(tableColumns));
    setSourceColumns(
      tableColumns[`${condition?.sourceTable || "-1"}`]?.columns || []
    );
    setTargetColumns(tableColumns[`${targetIndex}`]?.columns || []);
  }, [conditionIndex, initialData?.tables, tableColumns, targetIndex]);

  return (
    <>
      <div>
        <select
          value={condition?.sourceTable}
          onChange={(e) => {
            setCondition((prev) => {
              if (!prev) return prev;

              prev.sourceTable = e.target.value;
              return prev;
            });
            setValue(
              `tables.${targetIndex}.conditions.${conditionIndex}.sourceTable`,
              e.target.value
            );
          }}
        >
          <option value="">Please select</option>

          {sourceTables.map((index) => {
            return (
              <option key={index} value={index}>
                Table {index}
              </option>
            );
          })}
        </select>
      </div>
      <div>
        <select
          value={condition?.source}
          onChange={(e) => {
            setCondition((prev) => {
              if (!prev) return prev;

              prev.source = e.target.value;
              return prev;
            });
            setValue(
              `tables.${targetIndex}.conditions.${conditionIndex}.source`,
              e.target.value
            );
          }}
        >
          <option value="">Please select</option>
          {sourceColumns.map((column) => {
            return (
              <option key={column} value={column}>
                {column}
              </option>
            );
          })}
        </select>
      </div>
      <div>
        <select
          value={condition?.target}
          onChange={(e) => {
            setCondition((prev) => {
              if (!prev) return prev;

              prev.target = e.target.value;
              return prev;
            });
            setValue(
              `tables.${targetIndex}.conditions.${conditionIndex}.target`,
              e.target.value
            );
          }}
        >
          <option value="">Please select</option>
          {targetColumns.map((column) => {
            return (
              <option key={column} value={column}>
                {column}
              </option>
            );
          })}
        </select>
      </div>
    </>
  );
}
export default JoinConditionBuilder;
