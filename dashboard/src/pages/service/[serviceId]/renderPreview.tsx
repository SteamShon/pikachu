import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from "@mui/material";

import { useSnackbar } from "notistack";
import { useState } from "react";
import ContentPreview from "../../../components/builder/contentPreview";
import PlacementData from "../../../components/form/placement/placementData";
import SearchRequestForm from "../../../components/form/placement/searchRequestForm";
import type { SearchRequestSchemaType } from "../../../components/schema/searchRequest";
import { api } from "../../../utils/api";
import {
  AdSetSearchResult,
  SearchResult,
  searchAdSets,
} from "../../../utils/search";
import { buildUserInfo, search } from "../../../utils/search";
import { CodeEditor } from "react-live-runner";
import { jsonParseWithFallback } from "../../../utils/json";
import { toNewCreative } from "../../../utils/contentType";

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

  const [placement, setPlacement] =
    useState<Parameters<typeof SearchRequestForm>[0]["placement"]>(undefined);
  const [matchedAds, setMatchedAds] = useState<SearchResult[]>([]);
  const [adSetSearchResult, setAdSetSearchResult] = useState<
    AdSetSearchResult | undefined
  >(undefined);
  const [payload, setPayload] = useState<SearchRequestSchemaType | undefined>(
    undefined
  );
  const useAdSet = true;

  const searchMatchedAds = (data: SearchRequestSchemaType) => {
    setPayload(data);
    if (!serviceId || Array.isArray(serviceId)) return;
    if (useAdSet) {
      searchAdSets({
        serviceId: serviceId as string,
        payload: data,
      })
        .then((res) => {
          enqueueSnackbar("search API success.", { variant: "success" });
          setAdSetSearchResult(res);
        })
        .catch((e) => console.error(e));
    } else {
      search({
        serviceId: serviceId as string,
        payload: data,
      })
        .then((res) => {
          enqueueSnackbar("search API success.", { variant: "success" });
          setMatchedAds(res["matched_ads"] || []);
        })
        .catch((e) => console.error(e));
    }
  };

  const buildCurlCommand = () => {
    const userInfo = payload ? buildUserInfo(payload) : {};
    const data = {
      service_id: serviceId,
      placement_id: payload?.placementId,
      user_info: userInfo,
    };
    const request = JSON.stringify(data, null, 2);
    const route = useAdSet ? "search_ad_sets" : "search";
    return `
    CURL -X POST -H 'content-type:application/json' ${payload?.apiServerHost}/${route} -d '${request}'
    `;
  };
  const reactSdkCode = () => {
    return `
    import { usePikachu } from "@steamshon/pikachu-react";

    // connect to pikachu API usine usePikachu hook.
    const {
      renderCode,
      setUserInfo,
      component,
    } = usePikachu({
      endpoint: 'https://pikachu-api-server.fly.dev/search_ad_sets', 
      serviceId: '${service?.id}',
      placementId: '${placement?.id}',
      eventEndpoint: 'https://pikachu-event-server.fly.dev/publishes',
      useAdSet: true,
      debug: true,
    });

    // call UserInfo from hook to apply current user's info to update 
    const userInfo = ${JSON.stringify(payload ? buildUserInfo(payload) : {})}
    setUserInfo(userInfo);

    // render dynamic content component 
    return (
      <>
        {component}
      </>
    )
    `;
  };
  return (
    <>
      <SearchRequestForm
        placements={placements || []}
        placement={placement}
        setPlacement={setPlacement}
        setMatchedAds={setMatchedAds}
        onSubmit={(data) => {
          searchMatchedAds(data);
        }}
      />
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <Accordion>
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
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="react-sdk"
          >
            <Typography>React SDK </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {placement && <CodeEditor value={reactSdkCode()} />}
          </AccordionDetails>
        </Accordion>
      </div>
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="api-result"
          >
            <Typography>API Response</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              {JSON.stringify(useAdSet ? adSetSearchResult || {} : matchedAds)}
            </Typography>
          </AccordionDetails>
        </Accordion>
      </div>
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="api-result"
          >
            <Typography>Result</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              {matchedAds.map((placement) => {
                return (
                  <div key={placement.id}>
                    <ContentPreview
                      service={service}
                      contentType={placement.contentType}
                      creatives={placement.campaigns.flatMap((campaign) => {
                        return campaign.adGroups.flatMap((adGroup) => {
                          return adGroup.creatives.map((creative) => {
                            return {
                              ...creative,
                              content: jsonParseWithFallback(
                                creative.content.values
                              ),
                            };
                          });
                        });
                      })}
                      showEditor={false}
                    />
                  </div>
                );
              })}
              {adSetSearchResult && (
                <div>
                  <ContentPreview
                    service={service}
                    contentType={adSetSearchResult?.content_type}
                    creatives={(adSetSearchResult?.contents || []).map(
                      (content) => toNewCreative(content.values)
                    )}
                    showEditor={false}
                  />
                </div>
              )}
            </Typography>
          </AccordionDetails>
        </Accordion>
      </div>
    </>
  );
}
export default RenderPreview;
