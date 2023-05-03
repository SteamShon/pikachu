import { LiveEditor, LivePreview, LiveProvider } from "react-live";
import { extractCode } from "../../utils/contentTypeInfo";
import { jsonParseWithFallback } from "../../utils/json";
import type { SearchResult } from "../../utils/search";
import ContentPreview from "../builder/contentPreview";
import { replacePropsInFunction } from "../common/CodeTemplate";

function PlacementData({ placement }: { placement: SearchResult }) {
  const { contentType } = placement;

  const creatives = placement.campaigns.flatMap((campaign) => {
    return campaign.adGroups.flatMap((adGroup) => {
      return adGroup.creatives.map((creative) => {
        return {...creative, content: jsonParseWithFallback(creative.content.values) };
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
          <ContentPreview
            contentType={contentType}
            creatives={creatives}
            showEditor={false}
          />
        </div>
      </div>
    </>
  );
}
export default PlacementData;
