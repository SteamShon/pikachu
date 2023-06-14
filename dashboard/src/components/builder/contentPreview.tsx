// import type { BuilderContent } from "@builder.io/react";
// import { BuilderComponent } from "@builder.io/react";
import type { ContentType, Service } from "@prisma/client";
import { LiveEditor, LivePreview, LiveProvider } from "react-live";
import { extractCode } from "../../utils/contentType";
import { replacePropsInFunction } from "../common/CodeTemplate";
import SMSPlayground from "./smsPlayground";
import type { ServiceIntegrations } from "../schema/service";

function ContentPreview({
  service,
  contentType,
  creatives,
  showEditor,
}: {
  service: ServiceIntegrations;
  contentType?: ContentType;
  creatives: {
    id: string;
    content: { [key: string]: unknown };
    [key: string]: unknown;
  }[];
  showEditor?: boolean;
}) {
  console.log(creatives[0]?.content);
  const newCode = replacePropsInFunction({
    code: extractCode(contentType),
    creatives,
  });

  const preview = () => {
    if (contentType?.type === "SMS") {
      return (
        <>
          <SMSPlayground
            service={service}
            values={creatives[0]?.content || {}}
          />
        </>
      );
    } else {
      return (
        <>
          {/* <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-lg text-center">
              <h1 className="text-2xl font-bold sm:text-3xl">
                {contentType?.type} Preview
              </h1>
            </div>
          </div> */}
          <div className="mx-auto mt-8 mb-0 space-y-4 ">
            <LiveProvider code={newCode} noInline={true}>
              {showEditor ? <LiveEditor disabled /> : null}
              <LivePreview />
            </LiveProvider>
          </div>
        </>
      );
    }
  };
  return <>{preview()}</>;
}

export default ContentPreview;
