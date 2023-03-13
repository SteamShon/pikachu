import { useSnackbar } from "notistack";
import { useState } from "react";
import PlacementData from "../../../components/form/placementData";
import SearchRequestForm from "../../../components/form/searchRequestForm";
import type { SearchRequestSchemaType } from "../../../components/schema/searchRequest";
import { api } from "../../../utils/api";
import type { SearchResult } from "../../../utils/search";
import { search, buildUserInfo } from "../../../utils/search";

function RenderPreview({ serviceId }: { serviceId: string }) {
  const { enqueueSnackbar } = useSnackbar();
  const { data: placementGroups } = api.placementGroup.list.useQuery({
    serviceId: serviceId as string,
  });

  const [matchedAds, setMatchedAds] = useState<SearchResult[]>([]);
  const [payload, setPayload] = useState<SearchRequestSchemaType | undefined>(
    undefined
  );

  const searchMatchedAds = (data: SearchRequestSchemaType) => {
    setPayload(data);
    if (!serviceId || Array.isArray(serviceId)) return;

    search({
      serviceId: serviceId as string,
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
        placementGroups={placementGroups}
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
    </>
  );
}
export default RenderPreview;
