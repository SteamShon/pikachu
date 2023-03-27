import { useRouter } from "next/router";
import { api } from "../utils/api";

function PlacementMenu() {
  const router = useRouter();
  const { serviceId, placementId } = router.query;

  const { data: placements } = api.placement.list.useQuery({
    serviceId: serviceId as string,
  });

  return (
    <>
      <select
        className="p-1"
        value={placementId}
        onChange={(e) => {
          let query = {};
          if (e.target.value === "" && router.query[placementId as string]) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { placementId, ...rest } = router.query;
            query = rest;
          } else {
            query = { ...router.query, placementId: e.target.value };
          }
          router.push({
            pathname: router.pathname,
            query: query,
          });
        }}
      >
        <option value="">All</option>
        {(placements || []).map((placement) => (
          <option key={placement.name} value={placement.id}>
            {placement.name}
          </option>
        ))}
      </select>
    </>
  );
}

export default PlacementMenu;
