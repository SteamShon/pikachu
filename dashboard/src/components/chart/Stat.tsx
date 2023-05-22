import type { Service } from "@prisma/client";
import { api } from "../../utils/api";
import StatChart from "./StatChart";

function Stat({
  service,
  defaultGroupByKey,
}: {
  service: Service;
  defaultGroupByKey: string;
}) {
  const { data: creativeStats } = api.placement.getStats.useQuery({
    serviceId: service.id,
  });
  return (
    <>
      {creativeStats && (
        <StatChart
          creativeStats={creativeStats}
          defaultGroupByKey={defaultGroupByKey}
        />
      )}
    </>
  );
}

export default Stat;
