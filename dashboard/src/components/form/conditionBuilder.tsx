import { Button } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import type { Control, UseFormSetValue } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import type { DatasetSchemaType } from "../schema/dataset";
function ConditionBuilder({
  sourceOptions,
  targetOptions,
  index,
  control,
  setValue,
}: {
  sourceOptions: string[];
  targetOptions: string[];
  index: number;
  control: Control<DatasetSchemaType, unknown>;
  setValue: UseFormSetValue<DatasetSchemaType>;
}) {
  const { fields, append, remove } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormContext)
    name: `targets.${index}.conditions`, // unique name for your Field Array
  });
  return (
    <>
      <button type="button" onClick={() => append({ source: "", target: "" })}>
        Add
      </button>
      <Button
        type="button"
        onClick={() => append({ source: "", target: "" })}
        startIcon={<AddCircleOutlineIcon />}
      ></Button>
      {fields.map((field, i) => {
        return (
          <div key={field.id}>
            <select
              onChange={(e) =>
                setValue(
                  `targets.${index}.conditions.${i}.source`,
                  e.target.value
                )
              }
            >
              {sourceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              onChange={(e) =>
                setValue(
                  `targets.${index}.conditions.${i}.target`,
                  e.target.value
                )
              }
            >
              {targetOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => remove(i)}>
              Remove
            </button>
          </div>
        );
      })}
    </>
  );
}
export default ConditionBuilder;
