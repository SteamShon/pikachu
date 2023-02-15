import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import {
  Autocomplete,
  CircularProgress,
  debounce,
  TextField,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect, useMemo, useState } from "react";
import type { ValueEditorProps } from "react-querybuilder";
import { ValueEditor } from "react-querybuilder";
import { fetchValues, loadDuckDB } from "../../utils/duckdb";

const AsyncValueEditor = (props: ValueEditorProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const useSearch = props.fieldData?.useSearch || false;
  const { cube } = props.context;
  const [db, setDB] = useState<AsyncDuckDB | undefined>(undefined);
  const [inputValue, setInputValue] = useState<string | undefined>(undefined);
  const [options, setOptions] = useState<string[] | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const loading = open && !options;

  const fetch = useMemo(
    () =>
      debounce((prefix?: string) => {
        (async () => {
          // const duckDB = db ? db : await loadDuckDB(cube.cubeConfig);

          // if (!duckDB) {
          //   enqueueSnackbar("failed to initialize db.", { variant: "error" });
          //   return;
          // }
          // setDB(duckDB);

          const values = (
            await fetchValues(cube.cubeConfig, cube.s3Path, props.field, prefix)
          ).map((value) => String(value));

          setOptions(values);
        })();
      }, 1000),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cube.cubeConfig, cube.s3Path, props.field]
  );

  useEffect(() => {
    if (!useSearch) return;

    if (!open) {
      return;
    }
    fetch(inputValue);

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, inputValue, cube.cubeConfig, cube.s3Path]);

  return (
    <>
      {useSearch ? (
        <Autocomplete
          id="async-value-editor"
          open={open}
          onOpen={() => {
            setOpen(true);
          }}
          onClose={() => {
            setOpen(false);
          }}
          isOptionEqualToValue={(option, value) => option === value}
          getOptionLabel={(option) => option}
          options={options || []}
          loading={loading}
          multiple
          freeSolo
          autoComplete
          includeInputInList
          filterSelectedOptions
          value={(props.value as string).split(",").filter((v) => v.length > 0)}
          onInputChange={(_event, newInputValue) => {
            setInputValue(newInputValue);
          }}
          onChange={(_e, vs: string[], reason) => {
            const prevValues = (props.value as string)
              .split(",")
              .filter((v) => v.length > 0);
            console.log(reason);
            console.log(prevValues);
            console.log(vs);
            const newValues =
              reason === "selectOption"
                ? prevValues.concat(
                    vs.filter((current) => !prevValues.includes(current))
                  )
                : vs;
            props.handleOnChange(newValues.join(","));
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Values"
              fullWidth
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      ) : (
        <ValueEditor {...props} />
      )}
    </>
  );
};

export default AsyncValueEditor;
