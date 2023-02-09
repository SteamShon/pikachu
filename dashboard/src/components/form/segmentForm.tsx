import { zodResolver } from "@hookform/resolvers/zod";
import type { Cube, CubeConfig, Segment } from "@prisma/client";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import type { RuleGroupType } from "react-querybuilder";
import { formatQuery, parseSQL } from "react-querybuilder";
import CustomLoadingButton from "../common/CustomLoadingButton";
import type { SegmentWithCubeSchemaType } from "../schema/segment";
import { segmentWithCubeSchema } from "../schema/segment";
import SegmentQueryBuilder from "./segmentQueryBuilder";

function SegmentForm({
  cubes,
  cube,
  onSubmit,
  initialData,
}: {
  cubes: (Cube & { cubeConfig: CubeConfig })[];
  cube: Cube & { cubeConfig: CubeConfig; segments: Segment[] };
  onSubmit: (input: SegmentWithCubeSchemaType) => void;
  initialData?: Segment;
}) {
  const [query, setQuery] = useState<RuleGroupType | undefined>(undefined);
  const [, setPopulation] = useState<string | undefined>(undefined);
  const methods = useForm<SegmentWithCubeSchemaType>({
    resolver: zodResolver(segmentWithCubeSchema),
  });
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = methods;

  useEffect(() => {
    reset(initialData);
    if (initialData?.where) {
      setQuery(parseSQL(initialData.where));
    }
  }, [reset, initialData]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} id="segment-form">
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Segment
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Cube</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("cubeId")}
                    defaultValue={initialData?.cubeId}
                    disabled={initialData ? true : false}
                  >
                    <option value="">Please choose</option>
                    {cubes.map((cube) => {
                      return (
                        <option key={cube.id} value={cube.id}>
                          {cube.name}
                        </option>
                      );
                    })}
                  </select>
                  {errors.cubeId && (
                    <p role="alert">{errors.cubeId?.message}</p>
                  )}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <input
                    className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                    defaultValue={initialData?.name}
                    {...register("name")}
                  />
                  {errors.name && <p role="alert">{errors.name?.message}</p>}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Description
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <textarea
                    className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                    defaultValue={initialData?.description || undefined}
                    rows={3}
                    {...register("description")}
                  />
                  {errors.description && (
                    <p role="alert">{errors.description?.message}</p>
                  )}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <select
                    {...register("status")}
                    defaultValue={initialData?.status || "CREATED"}
                  >
                    <option value="">Please choose</option>
                    <option value="CREATED">CREATED</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                  {errors.status && (
                    <p role="alert">{errors.status?.message}</p>
                  )}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Where</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <SegmentQueryBuilder
                    cube={cube}
                    query={query}
                    onQueryChange={(newQuery) => {
                      setQuery(newQuery);
                      setValue("where", formatQuery(newQuery, "sql"));
                    }}
                    onPopulationChange={(newPopulation) => {
                      setPopulation(newPopulation);
                      setValue("population", newPopulation);
                    }}
                  />
                  {errors.where && <p role="alert">{errors.where?.message}</p>}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Population
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <input
                    className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                    defaultValue={initialData?.population || undefined}
                    {...register("population")}
                    disabled
                  />
                  {errors.population && (
                    <p role="alert">{errors.population?.message}</p>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <CustomLoadingButton
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
          />
        </div>
      </form>
    </FormProvider>
  );
}

export default SegmentForm;
