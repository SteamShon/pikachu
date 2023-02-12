import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TreeItem from "@mui/lab/TreeItem";
import TreeView from "@mui/lab/TreeView";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import type { CubeConfig } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import type { TreeNode } from "../../utils/aws";
import { listFoldersRecursively, loadS3, objectsToTree } from "../../utils/aws";

function CubePathBuilder({ cubeConfig }: { cubeConfig: CubeConfig }) {
  const [buckets, setBuckets] = useState<string[]>([]);
  const [bucket, setBucket] = useState<string | undefined>(undefined);

  const [paths, setPaths] = useState<string[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<string[] | undefined>(
    undefined
  );

  const [tree, setTree] = useState<TreeNode[]>([]);
  const [open, setOpen] = useState(false);
  const loading = bucket && open && paths.length === 0;

  const { control, register } = useForm();
  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray(
    {
      control, // control props comes from useForm (optional: if you are using FormContext)
      name: "test", // unique name for your Field Array
    }
  );

  useEffect(() => {
    (async () => {
      // const s3 = loadS3(cubeConfig);
      // const fetched = listBuckets({ s3 });
      const fetched = ["pikachu-dev"];
      console.log(cubeConfig);

      setBuckets(fetched);
    })();
  }, [cubeConfig]);

  useEffect(() => {
    if (!open) return;
    if (bucket) {
      loadPaths(bucket);
    }
  }, [cubeConfig, open, bucket]);

  const loadPaths = useMemo(
    () => async (bucketName: string, prefix?: string) => {
      const s3 = loadS3(cubeConfig);
      const folders = await listFoldersRecursively({
        s3,
        bucketName: bucketName,
        prefix,
      });

      const newPaths = [
        ...new Set(folders.map((p) => `s3://${bucketName}/${p.Key}`)),
      ];

      setTree(objectsToTree({ paths: folders }));
      setPaths(newPaths);
    },
    [cubeConfig]
  );

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Dataset</h3>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Source</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      S3 Buckets
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <select
                        onChange={(e) => loadPaths(e.target.value)}
                        value={bucket}
                      >
                        <option value="">Please choose</option>
                        {buckets.map((bucket) => {
                          return (
                            <option key={bucket} value={bucket}>
                              {bucket}
                            </option>
                          );
                        })}
                      </select>
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      S3 Paths
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <Autocomplete
                        id="path-selector"
                        fullWidth
                        open={open}
                        onOpen={() => {
                          setOpen(true);
                        }}
                        onClose={() => {
                          setOpen(false);
                        }}
                        isOptionEqualToValue={(option, value) =>
                          option === value
                        }
                        getOptionLabel={(option) => option}
                        options={paths}
                        loading={loading}
                        multiple
                        autoComplete
                        includeInputInList
                        filterSelectedOptions
                        value={selectedPaths}
                        // onInputChange={(_event, newInputValue) => {
                        //   setInputValue(newInputValue);
                        // }}
                        onChange={(_e, vs: string[], reason) => {
                          console.log(reason);
                          console.log(vs);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="S3 Paths"
                            fullWidth
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {loading ? (
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
                      {JSON.stringify(selectedPaths)}
                    </dd>
                  </div>
                </dl>
              </div>
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Targets</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              {fields.map((field, index) => (
                <input
                  key={field.id} // important to include key with field's id
                  {...register(`test.${index}.value`)}
                />
              ))}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
export default CubePathBuilder;
