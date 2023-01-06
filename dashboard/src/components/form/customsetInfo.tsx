import { Box, TextField, Typography } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

function CustomsetInfo() {
  const { control } = useFormContext();

  return (
    <Box>
      <Controller
        name="info.filePath"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="FilePath" fullWidth />
        )}
      />
      <Controller
        name="info.config"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Config" fullWidth />
        )}
      />
    </Box>
  );
}
export default CustomsetInfo;
