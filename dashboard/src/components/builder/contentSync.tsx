import type {
  ContentType,
  ContentTypeInfo,
  ServiceConfig,
} from "@prisma/client";
import { useState } from "react";
function ContentSync({
  serviceConfig,
  contentType,
  contents,
}: {
  serviceConfig?: ServiceConfig;
  contentType?: ContentType & { contentTypeInfo: ContentTypeInfo | null };
  contents: Record<string, unknown>[];
}) {
  const needUpdate = false;
  return (
    <>
      {needUpdate ? (
        <span className="inline-flex items-center justify-center rounded-full bg-red-100 px-2.5 py-0.5 text-red-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            className="-ml-1 mr-1.5 h-4 w-4"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>

          <p className="whitespace-nowrap text-sm">Outdated</p>
        </span>
      ) : (
        <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            className="-ml-1 mr-1.5 h-4 w-4"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>

          <p className="whitespace-nowrap text-sm"></p>
        </span>
      )}
    </>
  );
}

export default ContentSync;
