import LoadingButton from "@mui/lab/LoadingButton";
import { useState } from "react";
import type { FieldValues, UseFormHandleSubmit } from "react-hook-form";
import SendIcon from "@mui/icons-material/Send";

function CustomLoadingButton<TFieldValues extends FieldValues>({
  handleSubmit,
  onSubmit,
}: {
  handleSubmit: UseFormHandleSubmit<TFieldValues>;
  onSubmit: (input: TFieldValues) => void;
}) {
  const [loading, setLoading] = useState(false);

  return (
    <LoadingButton
      type="submit"
      variant="contained"
      loadingPosition="end"
      endIcon={<SendIcon />}
      onClick={handleSubmit((input) => {
        console.log(input);
        setLoading(true);
        onSubmit(input);
      })}
      loading={loading}
      className="inline-flex w-full justify-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
    >
      <span>Save</span>
    </LoadingButton>
  );
}

export default CustomLoadingButton;
