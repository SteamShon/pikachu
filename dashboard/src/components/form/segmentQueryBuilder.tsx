import DragIndicator from "@mui/icons-material/DragIndicator";
import SendIcon from "@mui/icons-material/Send";
import LoadingButton from "@mui/lab/LoadingButton";
import {
  Button,
  Card,
  Checkbox,
  createTheme,
  debounce,
  FormControl,
  FormControlLabel,
  Grid,
  Input,
  ListSubheader,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Switch,
  TextareaAutosize,
  ThemeProvider,
  Typography,
} from "@mui/material";
import type { Cube, CubeConfig } from "@prisma/client";
import { QueryBuilderMaterial } from "@react-querybuilder/material";
import { useSnackbar } from "notistack";
import { useEffect, useMemo, useState } from "react";
import type { RuleGroupType } from "react-querybuilder";
import QueryBuilder, { formatQuery } from "react-querybuilder";
import "react-querybuilder/dist/query-builder.scss";
import { countPopulation, executeQuery } from "../../utils/duckdb";
import AsyncValueEditor from "../common/AsyncValueEditor";

const muiTheme = createTheme();

const muiComponents = {
  Button,
  Checkbox,
  DragIndicator,
  FormControl,
  FormControlLabel,
  Input,
  ListSubheader,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Switch,
  TextareaAutosize,
};

const initialQuery: RuleGroupType = { combinator: "and", rules: [] };

function SegmentQueryBuilder({
  cube,
  query,
  onQueryChange,
  onPopulationChange,
}: {
  cube: Cube & { cubeConfig: CubeConfig };
  query?: RuleGroupType;
  population?: string;
  onQueryChange: (newQuery: RuleGroupType) => void;
  onPopulationChange: (population: string) => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [metadata, setMetadata] = useState<Record<string, unknown>[]>([]);
  const [populationLoading, setPopulationLoading] = useState(false);

  const loadMetadata = useMemo(
    () => async () => {
      if (!cube.sql) {
        enqueueSnackbar("cube sql is empty.", { variant: "error" });
        return;
      }
      const sql = `DESCRIBE ${cube.sql}`;
      const rows = await executeQuery(cube.cubeConfig, sql);
      enqueueSnackbar("finished loading metadata", { variant: "success" });
      setMetadata(rows);
    },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const fetchPopulation = useMemo(
    () =>
      debounce((q?: RuleGroupType) => {
        (async () => {
          if (!q) return;
          const sql = formatQuery(q, "sql");
          const count = await countPopulation({
            cubeConfig: cube.cubeConfig,
            sql: cube.sql || "",
            where: sql,
          });

          enqueueSnackbar("finished fetch population.", {
            variant: "success",
          });

          setPopulationLoading(false);
          onPopulationChange(count);
        })();
      }, 1000),

    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    loadMetadata();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cube.cubeConfig, cube.sql]);

  const fields = (metadata || []).map((row) => {
    const name = row.column_name as string;
    const type = row.column_type as string;
    let useSearch = false;
    switch (type) {
      case "VARCHAR":
        useSearch = true;
        break;
      default:
        useSearch = false;
        break;
    }
    return { name, label: `${name}(${type})`, columnType: type, useSearch };
    /*
    const type = row.column_type as string;
    if (name === "payment_type") {
      return { name, label: name, useSearch: true };
    }
    return { name: name, label: name, type };
    */
  });

  return (
    <Grid
      container
      direction="row"
      spacing={3}
      justifyContent="flex-start"
      // alignItems="stretch"
    >
      <Grid item xs={12}>
        <Card>
          <Typography>{cube.sql}</Typography>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <ThemeProvider theme={muiTheme}>
          <QueryBuilderMaterial muiComponents={muiComponents}>
            <QueryBuilder
              fields={fields}
              query={query || initialQuery}
              onQueryChange={onQueryChange}
              controlElements={{
                valueEditor: AsyncValueEditor,
              }}
              context={{ fields, cube }}
              controlClassnames={{ queryBuilder: "queryBuilder-branches" }}
            />
          </QueryBuilderMaterial>
        </ThemeProvider>
      </Grid>
      <Grid item xs={8}></Grid>
      <Grid item xs={3}>
        <LoadingButton
          type="button"
          variant="contained"
          loadingPosition="end"
          endIcon={<SendIcon />}
          onClick={() => {
            setPopulationLoading(true);
            fetchPopulation(query);
          }}
          loading={populationLoading}
          className="inline-flex w-full justify-end rounded-md border border-transparent bg-violet-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
        >
          <span>Calculate Population</span>
        </LoadingButton>
      </Grid>
      <Grid item xs={1}></Grid>
      <Grid item xs={12}>
        {query ? <pre>SQL: {formatQuery(query, "sql")}</pre> : null}
      </Grid>
    </Grid>
  );
}

export default SegmentQueryBuilder;
