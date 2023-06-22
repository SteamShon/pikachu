import type {
  AdSet,
  Content,
  Placement,
  Segment,
  Service,
} from "@prisma/client";
import { api } from "../../utils/api";
import StatChart from "./StatChart";

function AdSetStat({
  service,
  defaultGroupByKey,
}: {
  service?: Service;
  defaultGroupByKey: string;
}) {
  if (!service) return <></>;

  const { data: adSetStats } = api.placement.getAdSetStats.useQuery({
    serviceId: service.id,
  });

  const getLabel = (
    groupByKey: string,
    data?: AdSet & {
      placement: Placement;
      content: Content;
      segment: Segment | null;
    }
  ) => {
    switch (groupByKey) {
      case "placement":
        return data?.placement.name;
      case "adSet":
        return data?.name;
      case "content":
        return data?.content.name;
      case "segment":
        return data?.segment?.name;
      default:
        return undefined;
    }
  };
  return (
    <>
      {adSetStats && (
        <StatChart
          stats={adSetStats}
          defaultGroupByKey={defaultGroupByKey}
          getLabel={getLabel}
        />
      )}
    </>
  );
}

export default AdSetStat;
