import { Button } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
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
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="border-t border-gray-200">
        Condition
        <Button
          type="button"
          onClick={() => append({ source: "", target: "" })}
          startIcon={<AddCircleOutlineIcon />}
        ></Button>
      </div>
      {fields.map((field, i) => {
        return (
          <div key={field.id} className="border-t border-gray-200">
            <select
              onChange={(e) =>
                setValue(
                  `targets.${index}.conditions.${i}.source`,
                  e.target.value
                )
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
                setValue(
                  `targets.${index}.conditions.${i}.target`,
                  e.target.value
                )
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
              onClick={() => remove(i)}
              startIcon={<DeleteIcon />}
            ></Button>
          </div>
        );
      })}
    </div>
  );
}
export default ConditionBuilder;
