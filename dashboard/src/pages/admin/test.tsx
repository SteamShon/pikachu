import CubePathBuilder from "../../components/form/cubePathBuilder";
import { api } from "../../utils/api";

function Test() {
  const { data: cubeConfigs } = api.cubeConfig.getAll.useQuery({
    serviceId: "cldkg11lp0000ml0809k2yd0o",
  });

  return (
    <>
      {cubeConfigs?.at(0) ? (
        <CubePathBuilder cubeConfig={cubeConfigs.at(0)} />
      ) : null}
    </>
  );
}

export default Test;
