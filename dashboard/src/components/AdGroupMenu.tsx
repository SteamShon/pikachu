import { useRouter } from "next/router";
import { api } from "../utils/api";

function AdGroupMenu() {
  const router = useRouter();
  const { serviceId, placementId, campaignId, adGroupId } = router.query;

  const { data: adGroups } = api.adGroup.list.useQuery({
    serviceId: serviceId as string,
    placementId: placementId as string | undefined,
    campaignId: campaignId as string | undefined,
  });

  return (
    <>
      <select
        className="flex max-w-[10rem] overflow-auto p-1"
        value={adGroupId}
        onChange={(e) => {
          let query = {};
          if (e.target.value === "" && router.query[adGroupId as string]) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { adGroupId, ...rest } = router.query;
            query = rest;
          } else {
            query = { ...router.query, adGroupId: e.target.value };
          }
          router.push({
            pathname: router.pathname,
            query: query,
          });
        }}
      >
        <option value="">All</option>
        {(adGroups || []).map((adGroup) => (
          <option key={adGroup.name} value={adGroup.id}>
            {adGroup.name}
          </option>
        ))}
      </select>
    </>
  );
}

export default AdGroupMenu;
