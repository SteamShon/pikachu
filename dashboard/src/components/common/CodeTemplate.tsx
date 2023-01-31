export const InitialCode = `
function Test(contents) {
  const styles = {
    color: "red",
  };
  return(
    <div style={styles}>
    {contents.map((props) => {
      return <p>{props.title}</p>;
    })}
    </div>
  )
}
`;
export function removeRenderFunction(code?: string): string {
  const lines = (code ? code : InitialCode)
    .split("\n")
    .filter((line) => !line.includes("render ("));
  return lines.join("\n");
}

export function replacePropsInFunction({
  code,
  contents,
}: {
  code?: string;
  contents: Record<string, unknown>[];
}) {
  const replaceValue = `render (new Test(${JSON.stringify(contents)}))`;

  return [removeRenderFunction(code), replaceValue].join("\n");
  // return (code ? code : InitialCode).replace(
  //   /render(.*)\(.*\)/gm,
  //   replaceValue
  // );
}

export function CodeTemplate({
  uiSchema,
  props,
}: {
  uiSchema?: string | null;
  props: Record<string, unknown>;
}) {
  return `
function Test(props) {
  ${uiSchema || ""}
}

render (new Test(${JSON.stringify(props)}))`;
}
