import { zodResolver } from "@hookform/resolvers/zod";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import {
  Autocomplete,
  Button,
  CircularProgress,
  debounce,
  TextField,
} from "@mui/material";
import type { Cube, CubeConfig, PlacementGroup } from "@prisma/client";
import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import { useMemo, useState } from "react";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { executeQuery, fetchValues } from "../../utils/duckdb";
import type { SearchResult } from "../../utils/search";
import type { SearchRequestSchemaType } from "../schema/searchRequest";
import { searchRequestSchema } from "../schema/searchRequest";

function SearchRequestForm({
  placementGroups,
  setMatchedAds,
  onSubmit,
}: {
  placementGroups?: (PlacementGroup & {
    cube:
      | (Cube & {
          cubeConfig: CubeConfig;
        })
      | null;
  })[];
  setMatchedAds: Dispatch<SetStateAction<SearchResult[]>>;
  onSubmit: (input: SearchRequestSchemaType) => void;
}) {
  const [placementGroup, setPlacementGroup] = useState<
    | (PlacementGroup & {
        cube:
          | (Cube & {
              cubeConfig: CubeConfig;
            })
          | null;
      })
    | undefined
  >(undefined);
  const [metadata, setMetadata] = useState<Record<string, unknown>[]>([]);
  const [dimension, setDimension] = useState<string | undefined>(undefined);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const [open, setOpen] = useState(false);
  const loading = open && options.length === 0;

  const methods = useForm<SearchRequestSchemaType>({
    resolver: zodResolver(searchRequestSchema),
  });
  const { control, register, handleSubmit, setValue } = methods;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "dimensionValues",
  });

  useEffect(() => {
    if (placementGroup?.cube && placementGroup?.cube?.cubeConfig) {
      const load = async () => {
        const cube = placementGroup?.cube;
        if (!cube) return;

        const sql = `DESCRIBE ${cube.sql}`;
        const rows = await executeQuery(cube.cubeConfig, sql);
        setMetadata(rows);
      };
      load();
    }
  }, [placementGroup]);

  const fetchRemoteValues = useMemo(
    () =>
      debounce((index: number, field: string, prefix?: string) => {
        (async () => {
          if (!placementGroup) return;
          const { cube } = placementGroup;
          if (!cube || !cube?.sql || index !== selectedIndex) return;

          setMatchedAds([]);

          const values = (
            await fetchValues(cube.cubeConfig, cube.sql, field, prefix)
          ).map((value) => String(value));

          setOptions(values);
        })();
      }, 1000),

    [placementGroup, selectedIndex, setMatchedAds]
  );
  return (
    <FormProvider {...methods}>
      <form id="user-info-form">
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Placement Render Preview
              <Button
                onClick={handleSubmit(onSubmit)}
                startIcon={<SearchIcon />}
              >
                Search
              </Button>
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  PlacementGroup
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                    {...register("placementGroupId")}
                    onChange={(e) => {
                      const newPlacementGroup = placementGroups?.find(
                        (placementGroup) => placementGroup.id === e.target.value
                      );
                      setPlacementGroup(newPlacementGroup);
                    }}
                  >
                    <option value="">Please select</option>
                    {(placementGroups || []).map((placementGroup) => {
                      return (
                        <option
                          key={placementGroup.id}
                          value={placementGroup.id}
                        >
                          {placementGroup.name}
                        </option>
                      );
                    })}
                  </select>
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  API Server HOST
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <input
                    className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                    {...register("apiServerHost")}
                    defaultValue={"https://pikachu-server.fly.dev"}
                  />
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  User Info{" "}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <Button
                    onClick={() =>
                      append({ dimension: "dimension", values: [] })
                    }
                    startIcon={<AddCircleOutlineIcon />}
                  >
                    New
                  </Button>
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-12 gap-1 border-t border-gray-200"
                    >
                      <div className="col-span-4 bg-gray-50 px-4 py-5">
                        <select
                          {...register(`dimensionValues.${index}.dimension`)}
                          onChange={(e) => {
                            setSelectedIndex(index);
                            setDimension(e.target.value);
                            setOptions([]);
                          }}
                        >
                          <option value="">Please choose</option>
                          {metadata.map((column, idx) => (
                            <option
                              key={idx}
                              value={(column?.column_name as string) || ""}
                            >
                              {(column?.column_name as string) || ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-7 bg-gray-50 px-4 py-5">
                        <Controller
                          control={control}
                          name={`dimensionValues.${index}.values`}
                          render={({}) => (
                            <Autocomplete
                              id="asynchronous-values"
                              sx={{ width: 300 }}
                              open={selectedIndex === index && open}
                              onOpen={() => {
                                if (selectedIndex !== index) return;

                                setOpen(true);
                                if (dimension) {
                                  fetchRemoteValues(
                                    index,
                                    dimension,
                                    undefined
                                  );
                                }
                              }}
                              onClose={() => {
                                if (selectedIndex !== index) return;
                                setOpen(false);
                              }}
                              getOptionLabel={(option) => option}
                              options={selectedIndex === index ? options : []}
                              loading={loading}
                              multiple
                              onChange={(_e, vs: string[]) => {
                                setValue(`dimensionValues.${index}.values`, vs);
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="values"
                                  InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                      <>
                                        {selectedIndex === index && loading ? (
                                          <CircularProgress
                                            color="inherit"
                                            size={20}
                                          />
                                        ) : null}
                                        {params.InputProps.endAdornment}
                                      </>
                                    ),
                                  }}
                                />
                              )}
                            />
                          )}
                        />
                      </div>
                      <div className="col-span-1 bg-gray-50 px-4 py-5">
                        <Button
                          onClick={() => remove(index)}
                          startIcon={<DeleteIcon />}
                        />
                      </div>
                    </div>
                  ))}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

export default SearchRequestForm;
