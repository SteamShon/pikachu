import type {
  AdGroup,
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
  placementGroupId,
  payload,
}: {
  serviceId?: string;
  placementGroupId?: string;
  payload: SearchRequestSchemaType;
}): Promise<{ [x: string]: SearchResult[] }> {
  if (!serviceId || !placementGroupId)
    return Promise.resolve({ matched_ads: [], non_filter_ads: [] });

  //return Promise.resolve(mockResponse);

  return await axios<{ [x: string]: SearchResult[] }>({
    method: "post",
    url: (payload.apiServerHost || "http://localhost:8080") + "/search",
    data: {
      service_id: serviceId,
      placement_group_id: placementGroupId,
      user_info: buildUserInfo(payload),
    },
  }).then((res) => {
    console.log(res);
    return res.data;
  });
}
const mockResponse: { [x: string]: SearchResult[] } = {
  matched_ads: [
    {
      id: "cldlcxu5u0008jm0891d880a5",
      name: "제휴 쇼핑몰 리스트(대표 상품 리스트)",
      description: "",
      placementGroupId: "cldlcw9vs0004jm08mt90mk9n",
      campaigns: [
        {
          id: "cldlczk0p000ajm08uqfxbewa",
          name: "설날 제휴 쇼핑몰 컬렉션 지면 이미지 최적화 테스트",
          description: "",
          adGroups: [
            {
              id: "cldld074i000ejm08f3qnzt7v",
              name: "20대 남자 ",
              description: "",
              campaignId: "cldlczk0p000ajm08uqfxbewa",
              filter: '{"in":[{"var":"o_orderstatus"},["O","F","P"]]}',
              population: "60175",
              creatives: [
                {
                  id: "cldld2heb000ijm08jige66vr",
                  name: "20대 남자 지난 주 베스트셀러",
                  description: "",
                  adGroupId: "cldld074i000ejm08f3qnzt7v",
                  content: {
                    id: "cldlcv2p00000l508yoo27l19",
                    name: "마리오아울렛",
                    description: "",
                    contentTypeId: "cldlcqgg40000jm08ccj755f6",
                    values:
                      '{"shopName":"필웨이","title":"하이엔드 명품 브랜드 특가","imageUrl":"https://shop-phinf.pstatic.net/20230120_120/1674194160044J1ecn_JPEG/4_NEWS_3.jpg?type=w304","redirectUrl":"https://www.feelway.com/tobe/page/highEnd/list.php?utm_source=naver&utm_medium=cps&utm_campaign=shopping&utm_content=highend_0130"}',
                    creatorId: "cldkfvqfk0000v7xs68ptsxiu",
                    status: "PUBLISHED",
                    createdAt: new Date("2023-02-01T07:36:51.301+00:00"),
                    updatedAt: new Date("2023-02-01T15:02:53.456+00:00"),
                    userId: null,
                  },
                  contentId: "cldlcv2p00000l508yoo27l19",
                  status: "CREATED",
                  createdAt: new Date("2023-02-01T07:42:36.948+00:00"),
                  updatedAt: new Date("2023-02-01T07:42:36.948+00:00"),
                },
              ],
              status: "CREATED",
              createdAt: new Date("2023-02-01T07:40:50.322+00:00"),
              updatedAt: new Date("2023-03-07T14:20:11.724+00:00"),
            },
            {
              id: "clewi8pp40000v7jocdd3xrp6",
              name: "20대 여성",
              description: "",
              campaignId: "cldlczk0p000ajm08uqfxbewa",
              filter: '{"in":[{"var":"o_orderstatus"},["P","O"]]}',
              population: "30929",
              creatives: [
                {
                  id: "clewib9fi0004v7joglqnmjt8",
                  name: "20대 여성 소재",
                  description: "",
                  adGroupId: "clewi8pp40000v7jocdd3xrp6",
                  content: {
                    id: "cleychkbb0000v7yoxpbcnaxy",
                    name: "테스트 소재 1",
                    description: "",
                    contentTypeId: "cldlcqgg40000jm08ccj755f6",
                    values:
                      '{"title":"고양이","shopName":"도디","imageUrl":"https://www.lge.co.kr/kr/images/refrigerators/md09479832/gallery/medium01.jpg","redirectUrl":"https://shop-phinf.pstatic.net/20230120_120/1674194160044J1ecn_JPEG/4_NEWS_3.jpg?type=w304"}',
                    creatorId: "cldkfvqfk0000v7xs68ptsxiu",
                    status: "CREATED",
                    createdAt: new Date("2023-03-07T14:27:03.575+00:00"),
                    updatedAt: new Date("2023-03-07T14:27:03.575+00:00"),
                    userId: null,
                  },
                  contentId: "cleychkbb0000v7yoxpbcnaxy",
                  status: "CREATED",
                  createdAt: new Date("2023-03-06T07:34:34.875+00:00"),
                  updatedAt: new Date("2023-03-07T14:27:28.764+00:00"),
                },
              ],
              status: "CREATED",
              createdAt: new Date("2023-03-06T07:32:35.990+00:00"),
              updatedAt: new Date("2023-03-07T13:56:38.726+00:00"),
            },
          ],
          placementId: "cldlcxu5u0008jm0891d880a5",
          type: "DISPLAY",
          startedAt: new Date("2023-01-14T03:00:27+00:00"),
          endAt: new Date("2023-02-20T03:00:27+00:00"),
          status: "CREATED",
          createdAt: new Date("2023-02-01T07:40:20.378+00:00"),
          updatedAt: new Date("2023-02-01T07:41:52.212+00:00"),
        },
      ],
      contentType: {
        id: "cldlcqgg40000jm08ccj755f6",
        name: "제휴 쇼핑몰 리스트 지면",
        description: "",
        serviceId: "cldkg11lp0000ml0809k2yd0o",
        schema:
          '{"type":"object","title":"","description":"","properties":{"title":{"type":"string","title":"title","description":"","properties":{}},"shopName":{"type":"string","title":"shopName","description":"","properties":{}},"imageUrl":{"type":"string","title":"imageUrl","description":"","properties":{}},"redirectUrl":{"type":"string","title":"redirectUrl","description":"","properties":{}}},"required":["title","shop_name","product_image_url","redirect_url","shopName","imageUrl","redirectUrl"]}',
        uiSchema:
          '\nfunction Test(contents) {\n  const styles = {\n    color: "red",\n  };\n  return(\n    <div style={styles}>\n    {contents.map((props) => {\n      return <div>\n        <span>\n          <a href={props.redirectUrl} target="_blank">\n            <img align="center"  src={props.imageUrl}/>\n          </a>\n        </span>\n        <span>\n          {props.title}\n        </span>\n        <span>\n          {props.shopName}\n        </span>\n      </div>;\n    })}\n    </div>\n  )\n}\n',
        defaultValues:
          '{"title":"하이엔드 명품 브랜드 특가","shop_name":"아이스탁몰","product_image_url":"https://shop-phinf.pstatic.net/20230120_254/1674194162319t8caj_JPEG/4_NEWS_4.jpg?type=w304","redirect_url":"https://www.istockmall.com/eventmall_category.asp?uid=2527&src=image&kw=0006F5","shopName":"아이스탁몰","imageUrl":"https://shop-phinf.pstatic.net/20230120_254/1674194162319t8caj_JPEG/4_NEWS_4.jpg?type=w304","redirectUrl":"https://www.istockmall.com/eventmall_category.asp?uid=2527&src=image&kw=0006F5"}',
        status: "CREATED",
        createdAt: new Date("2023-02-01T07:33:15.844+00:00"),
        updatedAt: new Date("2023-03-06T07:36:22.236+00:00"),
      },
      contentTypeId: "cldlcqgg40000jm08ccj755f6",
      status: "CREATED",
      createdAt: new Date("2023-02-01T07:39:00.211+00:00"),
      updatedAt: new Date("2023-02-01T07:39:00.211+00:00"),
    },
  ],
  non_filter_ads: [],
};
