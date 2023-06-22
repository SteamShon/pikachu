import type {
  AdGroup,
  Campaign,
  Creative,
  Placement,
  Service,
} from "@prisma/client";
import { api } from "../../utils/api";
import StatChart from "./StatChart";

function Stat({
  service,
  defaultGroupByKey,
}: {
  service?: Service;
  defaultGroupByKey: string;
}) {
  if (!service) return <></>;

  const { data: creativeStats } = api.placement.getStats.useQuery({
    serviceId: service.id,
  });

  const getLabel = (
    groupByKey: string,
    data?: Creative & {
      adGroup: AdGroup & {
        campaign: Campaign & {
          placement: Placement;
        };
      };
    }
  ) => {
    switch (groupByKey) {
      case "placement":
        return data?.adGroup.campaign.placement.name;
      case "campaign":
        return data?.adGroup.campaign.name;
      case "adGroup":
        return data?.adGroup.name;
      case "creative":
        return data?.name;
      default:
        return undefined;
    }
  };
  return (
    <>
      {creativeStats && (
        <StatChart
          stats={creativeStats}
          defaultGroupByKey={defaultGroupByKey}
          getLabel={getLabel}
        />
      )}
    </>
  );
}

export default Stat;
