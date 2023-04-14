import axios from "axios";
import { type NextPage } from "next";
import { useEffect, useState } from "react";
import { LivePreview, LiveProvider } from "react-live-runner";

import { env } from "~/env.mjs";

function jsonParseWithFallback(
  s: string | undefined | null,
  fallback: Record<string, unknown> = {}
): Record<string, unknown> {
  try {
    if (!s) return fallback;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsed = JSON.parse(s);

    return parsed as Record<string, unknown>;
  } catch (error) {
    return fallback;
  }
}
function removeRenderFunction(code: string): string {
  const lines = code.split("\n").filter((line) => !line.includes("render ("));
  return lines.join("\n");
}
function replacePropsInFunction({
  code,
  contents,
}: {
  code: string;
  contents: Record<string, unknown>[];
}) {
  const replaceValue = `render (new Test(${JSON.stringify(contents)}))`;

  return [removeRenderFunction(code), replaceValue].join("\n");
}

const Home: NextPage = () => {
  const endpoint = env.NEXT_PUBLIC_PIKACHU_SEARCH_API_ENDPOINT;
  const serviceId = env.NEXT_PUBLIC_PIKACHU_SERVICE_ID;
  const [featured, setFeatured] = useState<string | undefined>(undefined);
  const [topList, setTopList] = useState<string | undefined>(undefined);
  const [genre, setGenre] = useState<string | undefined>(undefined);

  const parseResponse = (data: Record<string, unknown>) => {
    const code: string | undefined = (
      (
        (
          (data.matched_ads as Record<string, unknown>[] | undefined)?.[0]
            ?.contentType as Record<string, undefined> | undefined
        )?.contentTypeInfo as Record<string, unknown> | undefined
      )?.details as Record<string, unknown> | undefined
    )?.code as string;

    const contents: Record<string, unknown>[] | undefined = (
      data.matched_ads as Record<string, unknown>[] | undefined
    )?.flatMap((placement) => {
      return (placement.campaigns as Record<string, unknown>[])?.flatMap(
        (campaign) => {
          return (campaign.adGroups as Record<string, unknown>[])?.flatMap(
            (adGroup) => {
              return (adGroup.creatives as Record<string, unknown>[])?.map(
                (creative) => {
                  return creative.content as Record<string, unknown>;
                }
              );
            }
          );
        }
      );
    });

    return { code, contents };
  };

  useEffect(() => {
    const fetchComponent = (
      placementId: string,
      userInfo: Record<string, unknown>,
      onSuccess: (data: {
        code: string | undefined;
        contents: Record<string, unknown>[] | undefined;
      }) => void
    ) => {
      console.log("fetch component: ", placementId);
      axios
        .post(endpoint, {
          service_id: serviceId,
          placement_id: placementId,
          user_info: userInfo,
        })
        .then(({ data }) => {
          console.log(data);
          const res = parseResponse(data as Record<string, unknown>);
          onSuccess(res);
        })
        .catch((error) => console.error(error));
    };

    fetchComponent(
      "clgf56kk0000hl408m2ni4yy0",
      { genres: [genre] },
      ({ code, contents }) => {
        if (!code || !contents) {
          setFeatured(undefined);
          return;
        }

        const props = jsonParseWithFallback(
          contents[0]?.values as string | null | undefined
        );

        const newCode = replacePropsInFunction({
          code,
          contents: [props],
        });

        setFeatured(newCode);
      }
    );
    fetchComponent(
      "clgf7s3ji0005jl08u8oqg3sj",
      { genres: [genre] },
      ({ code, contents }) => {
        if (!code || !contents) {
          setTopList(undefined);
          return;
        }

        const propsList = contents.map((content) => {
          return jsonParseWithFallback(
            content?.values as string | null | undefined
          );
        });

        const newCode = replacePropsInFunction({
          code,
          contents: propsList,
        });
        setTopList(newCode);
      }
    );
  }, [endpoint, serviceId, genre]);

  const renderFeaturedRankingBanner = () => {
    const code = featured;

    return (
      <>
        {code ? (
          <LiveProvider code={code}>
            <LivePreview />
          </LiveProvider>
        ) : (
          <span className="text-2xl text-white">
            ReaturedRankingBanner Placement
          </span>
        )}
      </>
    );
  };
  const renderRankingCard = () => {
    const code = topList;

    return (
      <>
        {code ? (
          <LiveProvider code={code}>
            <LivePreview />
          </LiveProvider>
        ) : (
          <span className="text-2xl text-white">RankingCard Placement</span>
        )}
      </>
    );
  };
  const renderReviewCard = () => {
    return (
      <a
        className="relative flex items-start justify-between rounded-xl border border-gray-100 p-4 shadow-xl sm:p-6 lg:p-8"
        href="#"
      >
        <div className="pt-4 text-gray-500">
          <svg
            className="h-8 w-8 sm:h-10 sm:w-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
            ></path>
          </svg>

          <h3 className="mt-4 text-lg font-bold text-gray-900 sm:text-xl">
            Science of Chemistry
          </h3>

          <p className="mt-2 hidden text-sm sm:block">
            You can manage phone, email and chat conversations all from a single
            mailbox.
          </p>
        </div>

        <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-medium text-green-600">
          4.3
        </span>
      </a>
    );
  };
  const renderTodayPickCard = () => {
    return (
      <a href="#" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="Art"
          src="https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80"
          className="h-64 w-full object-cover sm:h-80 lg:h-96"
        />
        <h3 className="mt-4 text-center text-lg font-bold text-gray-900 sm:text-xl">
          Lorem, ipsum dolor.
        </h3>
        <p className="mt-2 max-w-sm text-gray-700">
          Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni
          reiciendis sequi ipsam incidunt.
        </p>
      </a>
    );
  };
  return (
    <>
      <div className="w-full divide-y-2 bg-[#101322]">
        <div className="mx-auto max-w-2xl justify-center bg-[#101322]">
          <form id="user-info-form">
            <div className="flex bg-gray-50 px-4 py-5 sm:gap-4 sm:px-6">
              <div className="text-sm font-medium text-gray-500">
                Customer Segment <br />
                <span className="text-medium font-medium">
                  사용자의 속성(genres)를 선택하면 해당 사용자에게 노출 되도록
                  타게팅된 contents들만 노출됩니다.
                </span>
              </div>
              <div className="grid grid-cols-12 gap-1 border-t border-gray-200">
                <div className="col-span-4 bg-gray-50 px-4 py-5">
                  <select
                    onChange={(e) => {
                      console.log(e.target.value);
                      setGenre(e.target.value);
                    }}
                  >
                    <option value="">Please choose</option>
                    {["Romance", "Action"].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </form>

          <input
            className="mt-10 w-full border-spacing-2 bg-[#172036]"
            placeholder="작품명,게시글,감독,배우를 검색해보세요"
          />

          <div className="mt-10 font-normal text-[#EFEFEF]">
            오늘의 넷플릭스 랭킹
          </div>

          <div className="mb-2 mt-2 h-[3%] border-spacing-1">
            {/* Ranking Featured Banner*/}
            {renderFeaturedRankingBanner()}
          </div>
          {/* Ranking Banner */}
          {renderRankingCard()}

          <div className="mt-10 font-normal text-[#EFEFEF]">
            최신 리뷰 한줄평
          </div>
          {/* Review */}
          <div className="mt-2 grid w-full grid-cols-4 gap-4">
            {renderReviewCard()}
            {renderReviewCard()}
            {renderReviewCard()}
            {renderReviewCard()}
          </div>

          <div className="mt-10 font-normal text-[#EFEFEF]">
            오늘 이거 볼까요?
          </div>
          {/* Today Pick */}
          <div className="mt-2 grid w-full grid-cols-4 gap-4">
            {renderTodayPickCard()}
            {renderTodayPickCard()}
            {renderTodayPickCard()}
            {renderTodayPickCard()}
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
