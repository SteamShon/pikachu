import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { api } from "../../../utils/api";
import { buildServiceTree } from "../../../utils/tree";

function ContentTypes() {
  const router = useRouter();

  const { serviceId, step } = router.query;

  const [tree, setTree] = useState<
    ReturnType<typeof buildServiceTree> | undefined
  >(undefined);

  const { data: service, isLoading } = api.service.get.useQuery({
    id: serviceId as string,
  });

  useEffect(() => {
    if (service) {
      setTree(buildServiceTree(service));
    }
  }, [service]);

  return <></>;
}
export default ContentTypes;
