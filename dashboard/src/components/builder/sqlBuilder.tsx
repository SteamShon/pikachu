import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { Button } from "@mui/material";
import type { CubeConfig } from "@prisma/client";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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
  const methods = useForm<DatasetSchemaType>({
    defaultValues: initialData,
    shouldUnregister: false,
  });
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
  console.log(initialData);
  return (
    <>
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        {fields.map((field, index) => {
          return (
            <div key={field.id} className="border-t border-gray-200">
              <div className="flex justify-center border-t border-gray-200">
                <h3>
                  Table {index}{" "}
                  <Button
                    type="button"
                    onClick={() => remove(index)}
                    startIcon={<HighlightOffIcon />}
                  />
                </h3>
              </div>
              <JoinCandidateBuilder
                cubeConfig={cubeConfig}
                index={index}
                methods={methods}
                tableColumns={tableColumns}
                setTableColumns={setTableColumns}
                initialData={initialData}
              />
            </div>
          );
        })}
      </div>
      <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => append(defaultValue)}
            startIcon={<AddCircleOutlineIcon />}
          >
            Add Table
          </Button>
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
        <Button
          onClick={handleSubmit(onSubmit)}
          className="inline-flex w-full justify-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
        >
          Update SQL
        </Button>
      </div>
    </>
  );
}
export default SqlBuilder;
