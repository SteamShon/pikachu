import type {
  AdGroup,
  AdSet,
  Campaign,
  Content,
  ContentType,
  Creative,
  Placement,
} from "@prisma/client";
import axios from "axios";
import type { SearchRequestSchemaType } from "../components/schema/searchRequest";

export type SearchResult = Placement & {
  contentType: ContentType;
  campaigns: (Campaign & {
    adGroups: (AdGroup & {
      creatives: (Creative & { content: Content })[];
    })[];
  })[];
};
export type AdSetSearchResult = {
  contentType: ContentType;
  adSets: { adSet: AdSet; content: Content }[];
};
export function flattenToContents(results: SearchResult[]) {
  results.map((placement) => {
    return placement.campaigns.flatMap((campaign) => {
      return campaign.adGroups.flatMap((adGroup) => {
        return adGroup.creatives.map((creative) => {
          return {
            ...creative.content,
            creative: {
              ...creative,
              adGroup: {
                ...adGroup,
                campaign: {
                  ...campaign,
                  placement: {
                    ...placement,
                  },
                },
              },
            },
          };
        });
      });
    });
  });
}
export async function updateAdMeta() {
  return await axios({
    method: "post",
    url: "http://127.0.0.1:8080/update_ad_meta",
    data: {},
  });
}
export function buildUserInfo(
  payload: SearchRequestSchemaType
): Record<string, string[]> {
  return payload.dimensionValues.reduce((prev, cur) => {
    prev[cur.dimension] = cur.values;
    return prev;
  }, {} as Record<string, string[]>);
}
export async function search({
  serviceId,
  payload,
}: {
  serviceId?: string;
  payload: SearchRequestSchemaType;
}): Promise<{ [x: string]: SearchResult[] }> {
  if (!serviceId)
    return Promise.resolve({ matched_ads: [], non_filter_ads: [] });

  //return Promise.resolve(mockResponse);

  return await axios<{ [x: string]: SearchResult[] }>({
    method: "post",
    url: payload.apiServerHost || "http://localhost:8080/search",
    data: {
      service_id: serviceId,
      placement_id: payload.placementId,
      user_info: buildUserInfo(payload),
    },
  }).then((res) => {
    console.log(res);
    return res.data;
  });
}

export async function searchAdSets({
  serviceId,
  payload,
}: {
  serviceId?: string;
  payload: SearchRequestSchemaType;
}): Promise<AdSetSearchResult | undefined> {
  if (!serviceId) return Promise.resolve(undefined);

  //return Promise.resolve(mockResponse);

  return await axios<AdSetSearchResult>({
    method: "post",
    url: payload.apiServerHost || "http://localhost:8080/search_ad_sets",
    data: {
      service_id: serviceId,
      placement_id: payload.placementId,
      user_info: buildUserInfo(payload),
    },
  }).then((res) => {
    console.log(res);
    return res.data;
  });
}
