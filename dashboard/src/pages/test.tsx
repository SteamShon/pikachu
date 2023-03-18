import { BuilderComponent, builder, Builder } from "@builder.io/react";
import { useEffect, useState } from "react";

builder.init("235143240a53401d9f6f49c476d291ec");

const Test = () => {
  const [builderContentJson, setBuilderContentJson] = useState(undefined);

  useEffect(() => {
    builder
      .get("hero", { url: location.pathname })
      .promise()
      .then(setBuilderContentJson);
  }, []);

  return <BuilderComponent model="hero" content={builderContentJson} />;
};
export default Test;
// Register your components for use in the visual editor!
// https://www.builder.io/blog/drag-drop-react
const Heading = (props) => <h1 className="my-heading">{props.title}</h1>;

Builder.registerComponent(Heading, {
  name: "Heading",
  inputs: [{ name: "title", type: "text" }],
});
