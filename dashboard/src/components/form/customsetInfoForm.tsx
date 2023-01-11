import { Box, TextField, Typography } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

function CustomsetInfoForm() {
  const { control } = useFormContext();

  return (
    <Box>
      <Controller
        name="customsetInfo.filePath"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="FilePath" fullWidth />
        )}
      />
      <Controller
        name="customsetInfo.config"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Config" fullWidth />
        )}
      />
    </Box>
  );
}
export default CustomsetInfoForm;
