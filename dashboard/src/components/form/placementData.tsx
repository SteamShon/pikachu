import { LiveEditor, LivePreview, LiveProvider } from "react-live";
import { jsonParseWithFallback } from "../../utils/json";
import type { SearchResult } from "../../utils/search";
import { replacePropsInFunction } from "../common/CodeTemplate";

function PlacementData({ placement }: { placement: SearchResult }) {
  const { contentType } = placement;
  const contents = placement.campaigns.flatMap((campaign) => {
    return campaign.adGroups.flatMap((adGroup) => {
      return adGroup.creatives.flatMap((creative) => {
        return creative.content;
      });
    });
  });
  return (
    <>
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {placement.name}
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Code</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                Preview
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <LiveProvider
                code={replacePropsInFunction({
                  code: contentType?.uiSchema || undefined,
                  contents: contents.map((content) => {
                    return jsonParseWithFallback(content.values);
                  }),
                })}
                noInline={true}
              >
                <dt className="text-sm font-medium text-gray-500">
                  <LiveEditor disabled />
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <LivePreview />
                </dd>
              </LiveProvider>
            </div>
          </dl>
        </div>
      </div>
    </>
  );
}
export default PlacementData;
