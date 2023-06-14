import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from "@mui/material";

import { useSnackbar } from "notistack";
import { useState } from "react";
import type ContentPreview from "../../../components/builder/contentPreview";
import PlacementData from "../../../components/form/placement/placementData";
import SearchRequestForm from "../../../components/form/placement/searchRequestForm";
import type { SearchRequestSchemaType } from "../../../components/schema/searchRequest";
import { api } from "../../../utils/api";
import type { SearchResult } from "../../../utils/search";
import { buildUserInfo, search } from "../../../utils/search";

function RenderPreview({
  service,
}: {
  service: Parameters<typeof ContentPreview>[0]["service"];
}) {
  const serviceId = service?.id;
  const { enqueueSnackbar } = useSnackbar();
  const { data: placements } = api.placement.list.useQuery({
    serviceId: serviceId as string,
  });
  const [matchedAds, setMatchedAds] = useState<SearchResult[]>([]);
  const [payload, setPayload] = useState<SearchRequestSchemaType | undefined>(
    undefined
  );

  const searchMatchedAds = (data: SearchRequestSchemaType) => {
    setPayload(data);
    if (!serviceId || Array.isArray(serviceId)) return;

    search({
      serviceId: serviceId as string,
      payload: data,
    })
      .then((res) => {
        enqueueSnackbar("search API success.", { variant: "success" });
        setMatchedAds(res["matched_ads"] || []);
      })
      .catch((e) => console.error(e));
  };
  const buildCurlCommand = () => {
    const userInfo = payload ? buildUserInfo(payload) : {};
    const data = {
      service_id: serviceId,
      placement_id: payload?.placementId,
      user_info: userInfo,
    };
    const request = JSON.stringify(data, null, 2);
    return `
    CURL -X POST -H 'content-type:application/json' ${payload?.apiServerHost}/search -d '${request}'
    `;
  };
  return (
    <>
      <SearchRequestForm
        placements={placements || []}
        setMatchedAds={setMatchedAds}
        onSubmit={(data) => {
          searchMatchedAds(data);
        }}
      />
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <Accordion expanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="api-request"
          >
            <Typography>API Request</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>{payload ? buildCurlCommand() : null}</Typography>
          </AccordionDetails>
        </Accordion>
      </div>

      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <Accordion expanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="api-result"
          >
            <Typography>API Result</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              {matchedAds.map((placement) => {
                return (
                  <div key={placement.id}>
                    <PlacementData service={service} placement={placement} />
                  </div>
                );
              })}
            </Typography>
          </AccordionDetails>
        </Accordion>
      </div>
    </>
  );
}
export default RenderPreview;
