import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
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
  initialData?: ConditionSchemaType;
}) {
  const [condition, setCondition] = useState<ConditionSchemaType | undefined>(
    initialData
  );
  const [sourceTables, setSourceTables] = useState<string[]>([]);
  const [sourceColumns, setSourceColumns] = useState<string[]>([]);
  const [targetColumns, setTargetColumns] = useState<string[]>([]);

  const { setValue } = methods;

  useEffect(() => {
    setCondition(initialData);
  }, [initialData]);

  useEffect(() => {
    const tables = initialData?.sourceTable
      ? [initialData?.sourceTable]
      : Object.keys(tableColumns);
    setSourceTables(tables);
  }, [initialData?.sourceTable, tableColumns]);

  useEffect(() => {
    const columns = initialData?.targetColumn
      ? [initialData?.targetColumn]
      : tableColumns[`${targetIndex}`]?.columns || [];
    setTargetColumns(columns);
  }, [initialData?.targetColumn, tableColumns, targetIndex]);

  useEffect(() => {
    const columns = initialData?.sourceColumn
      ? [initialData?.sourceColumn]
      : tableColumns[`${condition?.sourceTable || "-1"}`]?.columns;
    setSourceColumns(columns || []);
  }, [condition?.sourceTable, initialData?.sourceColumn, tableColumns]);

  const handleTableSourceSelect = (tableSource: string) => {
    setCondition((prev) => {
      if (!prev) return prev;

      prev.sourceTable = tableSource;
      return prev;
    });
    setValue(
      `tables.${targetIndex}.conditions.${conditionIndex}.sourceTable`,
      tableSource
    );
    setSourceColumns(tableColumns[`${tableSource}`]?.columns || []);
  };
  return (
    <>
      <div>
        <select
          value={condition?.sourceTable}
          onChange={(e) => handleTableSourceSelect(e.target.value)}
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
          value={condition?.sourceColumn}
          onChange={(e) => {
            setCondition((prev) => {
              if (!prev) return prev;

              prev.sourceColumn = e.target.value;
              return prev;
            });
            setValue(
              `tables.${targetIndex}.conditions.${conditionIndex}.sourceColumn`,
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
          value={condition?.targetColumn}
          onChange={(e) => {
            setCondition((prev) => {
              if (!prev) return prev;

              prev.targetColumn = e.target.value;
              return prev;
            });
            setValue(
              `tables.${targetIndex}.conditions.${conditionIndex}.targetColumn`,
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
