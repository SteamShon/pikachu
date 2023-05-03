import {
  CodeEditor as LiveCodeEditor,
  LiveError,
  LivePreview,
  LiveProvider,
} from "react-live-runner";
import { removeRenderFunction, replacePropsInFunction } from "../common/CodeTemplate";

function CodeEditor({
  code,
  creatives,
  options,
}: {
  code?: string;
  creatives: {id: string; content: {[key:string]:unknown}, [key:string]:unknown}[];
  options: {
    editor?: { disable: boolean; onChange?: (newCode: string) => void };
  };
}) {
  const newCode = replacePropsInFunction({
    code,
    creatives,
  });

  return (
    <LiveProvider code={newCode}>
      {options.editor ? (
        <>
          <LiveCodeEditor
            value={removeRenderFunction(newCode)}
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
