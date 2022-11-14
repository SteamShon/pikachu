import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Box, Divider, Grid, Tab, Tabs } from "@mui/material";
import JSONInput from "react-json-editor-ajrm";
import locale from "react-json-editor-ajrm/locale/en";
import { useState } from "react";
import Editor from "./editor";
import NonSSRWrapper from "../../components/no-ssr-wrapper";

export default function Create() {
  const [tabIndex, setTabIndex] = useState<string>("1");
  const [schema, setSchema] = useState<string>("{}");

  function tryParse(s: string): Record<string, unknown> | undefined {
    try {
      return JSON.parse(s) as Record<string, unknown>;
    } catch (e) {
      return undefined;
    }
  }

  return (
    <>
      <TabContext value={tabIndex}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList
            onChange={(e, idx) => setTabIndex(idx)}
            aria-label="lab API tabs example"
          >
            <Tab label="Json Schema" value="1" />
            <Tab label="Protobuf Schema" value="2" />
          </TabList>
        </Box>
        <TabPanel value="1">
          <NonSSRWrapper>
            <Editor />
          </NonSSRWrapper>
        </TabPanel>
        <TabPanel value="2">Hi</TabPanel>
      </TabContext>
    </>
  );
}
