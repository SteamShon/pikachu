import { useRouter } from "next/router";
import { api } from "../utils/api";

function CampaignMenu() {
  const router = useRouter();
  const { serviceId, placementId, campaignId } = router.query;

  const { data: campaigns } = api.campaign.list.useQuery({
    serviceId: serviceId as string,
    placementId: placementId as string | undefined,
  });

  return (
    <>
      <select
        className="p-1"
        value={campaignId}
        onChange={(e) => {
          let query = {};
          if (e.target.value === "" && router.query[campaignId as string]) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { campaignId, ...rest } = router.query;
            query = rest;
          } else {
            query = { ...router.query, campaignId: e.target.value };
          }
          router.push({
            pathname: router.pathname,
            query: query,
          });
        }}
      >
        <option value="">All</option>
        {(campaigns || []).map((campaign) => (
          <option key={campaign.name} value={campaign.id}>
            {campaign.name}
          </option>
        ))}
      </select>
    </>
  );
}

export default CampaignMenu;
