import { usePikachu } from "@steamshon/pikachu-react";
import { type NextPage } from "next";

import { env } from "~/env.mjs";

const Home: NextPage = () => {
  const endpoint = env.NEXT_PUBLIC_PIKACHU_SEARCH_API_ENDPOINT;
  const serviceId = env.NEXT_PUBLIC_PIKACHU_SERVICE_ID;
  const eventEndpoint = env.NEXT_PUBLIC_PIKACHU_EVENT_ENDPOINT;

  const featuredPlacementId = "clgf56kk0000hl408m2ni4yy0";
  const rankingCardPlacementId = "clgf7s3ji0005jl08u8oqg3sj";
  const {
    renderCode: featuredRenderCode,
    setUserInfo: featuredSetUserInfo,
    component: featuredComponent,
  } = usePikachu({
    endpoint,
    serviceId,
    placementId: featuredPlacementId,
    eventEndpoint,
    debug: true,
  });

  const {
    renderCode: rankingCardRenderCode,
    setUserInfo: rankingCardSetUserInfo,
    component: rankingCardComponent,
  } = usePikachu({
    endpoint,
    serviceId,
    placementId: rankingCardPlacementId,
    eventEndpoint,
    debug: true,
  });

  const renderFeaturedRankingBanner = () => {
    return <>{featuredComponent}</>;
  };
  const renderRankingCard = () => {
    return <>{rankingCardComponent}</>;
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
                  <a
                    className="text-base text-cyan-300"
                    href="https://pikachu-iota.vercel.app"
                    target="_blank"
                  >
                    Console
                  </a>{" "}
                  에 등록된 컨텐츠들이 설정된 사용자 segment별로 다르게 dynamic
                  placement에 노출 됩니다.
                </span>
              </div>
              <div className="grid grid-cols-12 gap-1 border-t border-gray-200">
                <div className="col-span-4 bg-gray-50 px-4 py-5">
                  <select
                    onChange={(e) => {
                      console.log(e.target.value);
                      const userInfo = {
                        userId: "steamshon",
                        info: { genres: [e.target.value] },
                      };
                      featuredSetUserInfo(userInfo);
                      rankingCardSetUserInfo(userInfo);
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
          <div className="mx-auto mt-20 max-w-2xl justify-center bg-[#101322]">
            <div className="text-white">Dynamic Placements</div>

            <div>
              <input
                className="mt-10 w-full border-spacing-2 bg-[#172036]"
                placeholder="작품명,게시글,감독,배우를 검색해보세요"
                readOnly={true}
              />
            </div>

            <div className="relative mt-10 font-normal text-[#EFEFEF]">
              <span>오늘의 넷플릭스 랭킹</span>
              <span className="absolute right-0 top-0">
                <span className="whitespace-nowrap rounded-full bg-green-100 px-2.5 py-0.5 text-sm text-gray-900">
                  <a href="https://pikachu-iota.vercel.app" target="_blank">
                    Powered By Pikachu
                  </a>
                </span>
              </span>
            </div>

            <div className="mb-2 mt-2 h-[3%] border-spacing-1">
              {/* Ranking Featured Banner*/}
              {renderFeaturedRankingBanner()}
            </div>
            <div className="relative mt-10 font-normal text-[#EFEFEF]">
              <span>랭킹 리스트</span>
              <span className="absolute right-0 top-0">
                <span className="whitespace-nowrap rounded-full bg-green-100 px-2.5 py-0.5 text-sm text-gray-900">
                  <a href="https://pikachu-iota.vercel.app" target="_blank">
                    Powered By Pikachu
                  </a>
                </span>
              </span>
            </div>
            <div className="mb-2 mt-2 h-[3%] border-spacing-1">
              {/* Ranking Banner */}
              {renderRankingCard()}
            </div>
          </div>
          <div className="text-white">Static Placements</div>
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
