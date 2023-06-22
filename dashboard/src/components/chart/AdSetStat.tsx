import type { Service } from "@prisma/client";
import { api } from "../../utils/api";
import AdSetStatChart from "./AdSetStatChart";

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
  return (
    <>
      {adSetStats && (
        <AdSetStatChart
          stats={adSetStats}
          defaultGroupByKey={defaultGroupByKey}
        />
      )}
    </>
  );
}

export default AdSetStat;
