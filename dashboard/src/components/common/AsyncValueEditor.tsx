import {
  Autocomplete,
  CircularProgress,
  createFilterOptions,
  debounce,
  TextField,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import type { ValueEditorProps } from "react-querybuilder";
import { ValueEditor } from "react-querybuilder";
import { fetchValues } from "../../utils/awsS3DuckDB";
import { extractValue } from "../../utils/json";

const AsyncValueEditor = (props: ValueEditorProps) => {
  const { integrationDetails } = props.context;
  const columnType = props.fieldData?.columnType;
  const useSearch = props.fieldData?.useSearch || false;
  const [inputValue, setInputValue] = useState<string | undefined>(undefined);
  const [options, setOptions] = useState<string[] | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const loading = open && !options;
  const cubeIntegrationSql = extractValue({
    object: integrationDetails,
    paths: ["SQL"],
  }) as string | undefined;

  const fetch = useMemo(
    () =>
      debounce((prefix?: string) => {
        (async () => {
          if (!cubeIntegrationSql) return;

          const values = (
            await fetchValues({
              details: integrationDetails,
              sql: cubeIntegrationSql,
              fieldName: props.field,
              columnType,
              value: prefix,
            })
          ).map((value) => String(value));

          setOptions(values);
        })();
      }, 1000),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [integrationDetails, props.field]
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
  }, [loading, inputValue, integrationDetails]);

  const filterOptions = createFilterOptions({
    matchFrom: "any",
    limit: 100,
  });

  const valueSearchEditor = (
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
      getOptionLabel={(option) => option as string}
      options={options || []}
      loading={loading}
      multiple
      freeSolo
      autoComplete
      fullWidth
      includeInputInList
      filterSelectedOptions
      filterOptions={filterOptions}
      value={(props.value as string).split(",").filter((v) => v.length > 0)}
      onInputChange={(_event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      onChange={(_e, _vs: unknown[], reason) => {
        const vs = _vs.map((v) => v as string);
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
  );

  if (useSearch) {
    return valueSearchEditor;
  } else {
    return <ValueEditor {...props} />;
  }
};

export default AsyncValueEditor;
