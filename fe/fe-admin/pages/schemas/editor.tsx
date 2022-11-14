import JsonSchemaEditor from "@quiet-front-end/json-schema-editor-antd";
import "antd/dist/antd.css";
import { useState } from "react";

export default function Editor() {
  console.log(window);
  const [jsonData, setJsonData] = useState({});

  return (
    <>
      <JsonSchemaEditor
        mock={true}
        jsonEditor={true}
        data={jsonData}
        onChange={(data) => {
          setJsonData(data);
        }}
      />
    </>
  );
}
