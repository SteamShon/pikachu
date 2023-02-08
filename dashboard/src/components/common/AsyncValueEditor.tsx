import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import type { Cube, CubeConfig } from "@prisma/client";
import { useEffect, useState } from "react";
import type { ValueEditorProps } from "react-querybuilder";
import { fetchValuesInner, loadDuckDB } from "../../utils/duckdb";

const AsyncValueEditor = (props: ValueEditorProps) => {
  const { fields, cube } = props.context;
  const [db, setDB] = useState<AsyncDuckDB | undefined>(undefined);
  // const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [values, setValues] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const loading = open && values.length === 0;

  useEffect(() => {
    let active = true;

    if (!loading) {
      return undefined;
    }

    (async () => {
      console.log("loading values");
      const duckDB = db ? db : await loadDuckDB(cube.cubeConfig);
      setDB(duckDB);

      const values = (
        await fetchValuesInner(duckDB, cube.s3Path, props.field)
      ).map((value) => String(value));
      // const values = ["0", "1", "2", "3"];
      if (active) {
        setValues(values);
      }
    })();

    return () => {
      active = false;
    };
  }, [loading, props.field]);

  return (
    <>
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
        options={values}
        loading={loading}
        multiple
        freeSolo
        value={(props.value as string).split(",").filter((v) => v.length > 0)}
        onChange={(e, vs: string[], reason) => {
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
            //onChange={(e) => props.handleOnChange(e.target.value)}
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
    </>
  );
};

export default AsyncValueEditor;
