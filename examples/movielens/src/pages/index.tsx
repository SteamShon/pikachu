import axios from "axios";
import { type NextPage } from "next";
import { useEffect, useState } from "react";
import { LivePreview, LiveProvider } from "react-live-runner";

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

type ComponentType = Record<string, string>;

const Home: NextPage = () => {
  const endpoint = "http://localhost:8080/search";
  const serviceId = "clgejgn7e0006me08bd1xxf44";
  const [featured, setFeatured] = useState<string | undefined>(undefined);
  const [topList, setTopList] = useState<string | undefined>(undefined);
  const user_info = { genres: ["Action"] };

  useEffect(() => {
    axios
      .post(endpoint, {
        service_id: serviceId,
        placement_id: "clgf56kk0000hl408m2ni4yy0",
        user_info,
      })
      .then(({ data }) => {
        const code: string | undefined =
          data.matched_ads?.[0]?.contentType?.contentTypeInfo?.details?.code;
        const contents: Record<string, unknown>[] | undefined =
          data.matched_ads?.flatMap((placement) => {
            return placement.campaigns?.flatMap((campaign) => {
              return campaign.adGroups.flatMap((adGroup) => {
                return adGroup.creatives.flatMap((creative) => {
                  return creative.content;
                });
              });
            });
          });
        console.log(code);
        console.log(contents);
        if (code && contents) {
          const props = jsonParseWithFallback(
            contents[0]?.values as string | null | undefined
          );

          const newCode = replacePropsInFunction({
            code,
            contents: [props],
          });

          setFeatured(newCode);
        }
      })
      .catch((error) => console.error(error));
    axios
      .post(endpoint, {
        service_id: serviceId,
        placement_id: "clgf7s3ji0005jl08u8oqg3sj",
        user_info,
      })
      .then(({ data }) => {
        const code: string | undefined =
          data.matched_ads?.[0]?.contentType?.contentTypeInfo?.details?.code;
        const contents: Record<string, unknown>[] | undefined =
          data.matched_ads?.flatMap((placement) => {
            return placement.campaigns?.flatMap((campaign) => {
              return campaign.adGroups.flatMap((adGroup) => {
                return adGroup.creatives.flatMap((creative) => {
                  return creative.content;
                });
              });
            });
          });
        console.log(code);
        console.log(contents);
        if (code && contents) {
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
      })
      .catch((error) => console.error(error));
  }, []);

  const renderFeaturedRankingBanner = () => {
    const code = featured;

    return (
      <>
        {code ? (
          <LiveProvider code={code}>
            <LivePreview />
          </LiveProvider>
        ) : (
          <span>NotFound</span>
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
          <span>NotFound</span>
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
      <div className="w-full bg-[#101322]">
        <div className="mx-auto max-w-2xl justify-center bg-[#101322]">
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
