import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { Button } from "@mui/material";
import type { CubeConfig } from "@prisma/client";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { buildJoinSql } from "../../utils/dataset";
import type { DatasetSchemaType } from "../schema/dataset";
import JoinCandidateBuilder from "./joinCandidateBuilder";

export type TableMetadata = {
  [index: string]: {
    columns: string[];
  };
};
function SqlBuilder({
  cubeConfig,
  initialData,
  onSubmit,
}: {
  cubeConfig: CubeConfig;
  initialData?: DatasetSchemaType;
  onSubmit: (input: DatasetSchemaType) => void;
}) {
  const [tableColumns, setTableColumns] = useState<TableMetadata>({});
  const methods = useForm<DatasetSchemaType>();
  const { control, reset, handleSubmit } = methods;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "tables",
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [cubeConfig, initialData, reset]);

  const defaultValue = { files: [], conditions: [] };

  return (
    <form id="sqlBuilder">
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="border-t border-gray-200">
          <h3>
            Target
            <Button
              type="button"
              onClick={() => append(defaultValue)}
              startIcon={<AddCircleOutlineIcon />}
            />
          </h3>
        </div>
        {fields.map((field, index) => {
          return (
            <div key={field.id} className="border-t border-gray-200">
              <JoinCandidateBuilder
                cubeConfig={cubeConfig}
                index={index}
                methods={methods}
                tableColumns={tableColumns}
                setTableColumns={setTableColumns}
              />
              <div className="flex justify-end bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <Button type="button" onClick={() => remove(index)}>
                  Remove Table
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <Button onClick={handleSubmit((data) => alert(buildJoinSql(data)))}>
        Generate SQL
      </Button>
    </form>
  );
}
export default SqlBuilder;
