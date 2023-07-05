export const InitialCode = `

/*
 * Define how to render this placement with creatives fetched from API. 
 * user provided form will consist content variable.
 * 
 * creatives: { 
 *  id: string; 
 *  content: {[key:string]: unknown}; 
 *  [key:string]: unknown
 * }[]
 */
function Test(creatives) {
  return(
    /* root div must use class placement */
    <div class="placement">
    {creatives.map(({id, content}, index) => {
      /* 
       * each creative div must use class creative
       * also key and id prop need to be set with creative's unique id
       * to send click/impression event correctly
       */
      return (
        <>
          <div key={id} id={id} className="creative flex border-spacing-1 p-4">
            {/* modify here to code how to each creative will be rendered */}
            <div className="w-20">
              <a href={content.redirectUrl} target="_blank">
                <img
                  alt="Featured"
                  src={content.image}
                />
              </a>
            </div>
            <div className="w-30 ml-4 text-2xl">
                {index+1}
            </div>            
            <div className="w-30 ml-4 mt-1 font-medium">
                {content.title}
            </div>
          </div>
        </>
      );
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
  creatives,
}: {
  code?: string;
  creatives: {
    id: string;
    content: { [key: string]: unknown };
    [key: string]: unknown;
  }[];
}) {
  const replaceValue = `render (new Test(${JSON.stringify(creatives)}))`;

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
