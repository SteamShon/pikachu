import { useRouter } from "next/router";
import TableMetadata from "../../../../../components/common/TableMetadata";
import { api } from "../../../../../utils/api";

function QueryBuilder() {
  const router = useRouter();
  const { serviceId, cubeConfigId, cubeId } = router.query;

  const { data: cube } = api.cube.get.useQuery({
    id: (cubeId || "") as string,
  });

  return <>{cube ? <TableMetadata cube={cube} /> : null}</>;
}

export default QueryBuilder;
