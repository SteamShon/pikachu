import { useRouter } from "next/router";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import PlacementData from "../../../../../components/form/placementData";
import SearchRequestForm from "../../../../../components/form/searchRequestForm";
import type { SearchRequestSchemaType } from "../../../../../components/schema/searchRequest";
import { api } from "../../../../../utils/api";
import { executeQuery } from "../../../../../utils/duckdb";
import type { SearchResult } from "../../../../../utils/search";
import { buildUserInfo, search } from "../../../../../utils/search";

function Display() {
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  const { serviceId, placementGroupId } = router.query;
  const { data: placementGroup, isLoading } = api.placementGroup.get.useQuery({
    id: placementGroupId as string,
  });

  const [metadata, setMetadata] = useState<Record<string, unknown>[]>([]);

  const [matchedAds, setMatchedAds] = useState<SearchResult[]>([]);
  const [payload, setPayload] = useState<SearchRequestSchemaType | undefined>(
    undefined
  );

  useEffect(() => {
    if (placementGroup?.cube && placementGroup?.cube?.cubeConfig) {
      const load = async () => {
        const cube = placementGroup?.cube;
        if (!cube) return;

        const sql = `DESCRIBE ${cube.sql}`;
        const rows = await executeQuery(cube.cubeConfig, sql);
        setMetadata(rows);
      };
      load()
        .then(() =>
          enqueueSnackbar("cube loading finished", { variant: "success" })
        )
        .catch(() =>
          enqueueSnackbar("cube loading failed.", { variant: "error" })
        );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const searchMatchedAds = (data: SearchRequestSchemaType) => {
    setPayload(data);
    if (
      !serviceId ||
      !placementGroupId ||
      Array.isArray(serviceId) ||
      Array.isArray(placementGroupId)
    )
      return;

    search({
      serviceId: serviceId as string,
      placementGroupId: placementGroupId as string,
      payload: data,
    })
      .then((res) => {
        enqueueSnackbar("search API success.", { variant: "success" });
        setMatchedAds(res["matched_ads"] || []);
      })
      .catch((e) => console.error(e));
  };
  const buildCurlCommand = () => {
    const data = payload ? buildUserInfo(payload) : {};
    const request = JSON.stringify(data, null, 2);
    return `
    CURL -X POST -H 'content-type:application/json' ${payload?.apiServerHost}/search -d '${request}'
    `;
  };
  return (
    <>
      <SearchRequestForm
        cube={placementGroup?.cube || undefined}
        columns={metadata}
        setMatchedAds={setMatchedAds}
        onSubmit={(data) => {
          searchMatchedAds(data);
        }}
      />
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            API Request
          </h3>
        </div>
        {payload ? buildCurlCommand() : null}
      </div>

      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            API Result
          </h3>
        </div>
        {matchedAds.map((placement) => {
          return (
            <div key={placement.id}>
              <PlacementData placement={placement} />
            </div>
          );
        })}
      </div>

      {/* <Grid
        container
        direction="row"
        justifyContent="flex-start"
        alignItems="stretch"
      >
        <Grid item xs={6}>
          <UserInfoForm
            cube={placementGroup?.cube || undefined}
            columns={metadata}
            onSubmit={(data) => {
              console.log(data);
              const userInfo = data.dimensionValues.reduce((prev, cur) => {
                prev[cur.dimension] = cur.values;
                return prev;
              }, {} as Record<string, string[]>);
              setUserInfo(userInfo);
              // onSubmit();
            }}
          />
        </Grid>

        <Grid item xs={6}>
          <div className="overflow-hidden bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Matched Ads
              </h3>
            </div>
            <div className="border-t border-gray-200">
              {matchedAds.map((placement) => {
                return (
                  <div key={placement.id}>
                    <PlacementData placement={placement} />
                  </div>
                );
              })}
            </div>
          </div>
        </Grid>
      </Grid> */}
    </>
  );
}
export default Display;
