import { useRouter } from "next/router";
import { api } from "../utils/api";

function ServiceMenu() {
  const router = useRouter();
  const { serviceId } = router.query;
  const { data: service } = api.service.getOnlyService.useQuery({
    id: serviceId as string,
  });
  const { data: services } = api.user.getServices.useQuery();

  return (
    <>
      <select
        className="p-1"
        value={service?.id}
        onChange={(e) => router.push(`/service/${e.target.value}/dashboard`)}
      >
        {(services || []).map(({ service }) => (
          <option key={service.name} value={service.id}>
            {service.name}
          </option>
        ))}
      </select>
    </>
  );
}

export default ServiceMenu;
