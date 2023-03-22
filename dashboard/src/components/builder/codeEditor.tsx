import { LiveEditor, LivePreview, LiveProvider } from "react-live";
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
    <LiveProvider code={newCode} noInline={true}>
      {options.editor ? (
        <LiveEditor
          disabled={options.editor.disable}
          onChange={(newCode) => {
            if (options.editor?.onChange) {
              options.editor.onChange(newCode);
            }
          }}
        />
      ) : null}
      <LivePreview />
    </LiveProvider>
  );
}

export default CodeEditor;
