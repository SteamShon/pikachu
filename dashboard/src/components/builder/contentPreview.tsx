import type { BuilderContent } from "@builder.io/react";
import { BuilderComponent } from "@builder.io/react";
import type { ContentType, ContentTypeInfo } from "@prisma/client";
import { LiveEditor, LivePreview, LiveProvider } from "react-live";
import { extractCode } from "../../utils/contentTypeInfo";
import { replacePropsInFunction } from "../common/CodeTemplate";

function ContentPreview({
  contentType,
  contents,
  showEditor,
}: {
  contentType?: ContentType & { contentTypeInfo: ContentTypeInfo | null };
  contents: Record<string, unknown>[];
  showEditor?: boolean;
}) {
  const builderContent =
    contentType?.source !== "builder.io" || contents.length === 0
      ? undefined
      : (contents[0] as unknown as BuilderContent);

  const newCode = replacePropsInFunction({
    code: extractCode(contentType?.contentTypeInfo),
    contents,
  });

  const preview = () => {
    if (builderContent) {
      return (
        <BuilderComponent
          model={contentType?.name}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          content={builderContent as BuilderContent}
        />
      );
    } else {
      return (
        <LiveProvider code={newCode} noInline={true}>
          {showEditor ? <LiveEditor disabled /> : null}
          <LivePreview />
        </LiveProvider>
      );
    }
  };
  return <>{preview()}</>;
}

export default ContentPreview;
