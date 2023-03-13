import { LivePreview, LiveProvider } from "react-live";
import { jsonParseWithFallback } from "../../utils/json";
import type { SearchResult } from "../../utils/search";
import { replacePropsInFunction } from "../common/CodeTemplate";

function PlacementData({ placement }: { placement: SearchResult }) {
  const contentType = placement.contentType;

  return (
    <>
      <p>Placement: {placement.name}</p>
      {placement.campaigns.map((campaign) => {
        return (
          <div key={campaign.id}>
            <p>Campaign: {campaign.name}</p>
            {campaign.adGroups.map((adGroup) => {
              return (
                <div key={adGroup.id}>
                  <p>AdGroup: {adGroup.name}</p>
                  <LiveProvider
                    code={replacePropsInFunction({
                      code: contentType?.uiSchema || undefined,
                      contents: adGroup.creatives
                        .map((creative) => creative.content)
                        .map((content) =>
                          jsonParseWithFallback(content?.values)
                        ),
                    })}
                    noInline={true}
                    className="p-12"
                  >
                    <LivePreview />
                  </LiveProvider>
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}
export default PlacementData;
