import {
  CodeEditor as LiveCodeEditor,
  LiveError,
  LivePreview,
  LiveProvider,
} from "react-live-runner";
import { replacePropsInFunction } from "../common/CodeTemplate";

function CodeEditor({
  code,
  contents,
  options,
}: {
  code?: string;
  contents: Record<string, unknown>[];
  options: {
    editor?: { disable: boolean; onChange?: (newCode: string) => void };
  };
}) {
  const newCode = replacePropsInFunction({
    code,
    contents,
  });

  return (
    <LiveProvider code={newCode}>
      {options.editor ? (
        <>
          <LiveCodeEditor
            value={newCode}
            disabled={options.editor.disable}
            onChange={(newCode) => {
              if (options.editor?.onChange) {
                options.editor.onChange(newCode);
              }
            }}
          />
          <LiveError />
        </>
      ) : null}
      <LivePreview />
    </LiveProvider>
  );
}

export default CodeEditor;
