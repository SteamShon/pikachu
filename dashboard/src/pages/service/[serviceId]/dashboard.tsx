import { Grid } from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Loading from "../../../components/common/Loading";
import { api } from "../../../utils/api";
import { buildServiceTree } from "../../../utils/tree";
import AdGroupTable from "./adGroupTable";
import CampaignTable from "./campaignTable";
import ContentTable from "./contentTable";
import ContentTypeTable from "./contentTypeTable";
import CreativeTable from "./creativeTable";
import CubeConfigTable from "./cubeConfigTable";
import CustomsetTable from "./customsetTable";
import PlacementGroupTable from "./placementGroupTable";
import PlacementTable from "./placementTable";
import SideMenu from "./sideMenu";

function Dashboard() {
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

  const steps = [
    {
      label: "PlacementGroups",
      description: `placementGroups`,
      table: () =>
        service ? (
          <PlacementGroupTable
            service={service}
            setServiceTree={setTree}
            serviceTree={tree}
          />
        ) : null,
    },
    {
      label: "Placements",
      description: `placements`,
      table: () =>
        service ? (
          <PlacementTable setServiceTree={setTree} serviceTree={tree} />
        ) : null,
    },
    {
      label: "Campaigns",
      description: `campaigns`,
      table: () =>
        service ? (
          <CampaignTable setServiceTree={setTree} serviceTree={tree} />
        ) : null,
    },
    {
      label: "AdGroups",
      description: `adGroups`,
      table: () =>
        service ? (
          <AdGroupTable setServiceTree={setTree} serviceTree={tree} />
        ) : null,
    },
    {
      label: "Creatives",
      description: `creatives`,
      table: () =>
        service ? (
          <CreativeTable setServiceTree={setTree} serviceTree={tree} />
        ) : null,
    },
    {
      label: "ContentTypes",
      description: `contentTypes`,
      table: () =>
        service ? (
          <ContentTypeTable
            service={service}
            setServiceTree={setTree}
            serviceTree={tree}
          />
        ) : null,
    },
    {
      label: "Contents",
      description: `contents`,
      table: () =>
        service ? (
          <ContentTable setServiceTree={setTree} serviceTree={tree} />
        ) : null,
    },
    {
      label: "Customsets",
      description: `customsets`,
      table: () =>
        service ? (
          <CustomsetTable
            service={service}
            setServiceTree={setTree}
            serviceTree={tree}
          />
        ) : null,
    },
    {
      label: "CubeConfigs",
      description: `cubeConfigs`,
      table: () =>
        service ? (
          <CubeConfigTable
            service={service}
            setServiceTree={setTree}
            serviceTree={tree}
          />
        ) : null,
    },
  ];
  const activeStep = step
    ? steps.findIndex((s) => s.label === (step as string))
    : 0;

  if (isLoading) return <Loading />;

  return (
    <Grid
      container
      direction="row"
      justifyContent="flex-start"
      alignItems="stretch"
    >
      <Grid item xs={2} sx={{ height: "100%" }}>
        <SideMenu />
      </Grid>
      {/* <Grid item xs={10} />
      <Grid item xs={2}>
        <Stepper nonLinear activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepButton
                onClick={() => {
                  router.query.step = step.label;
                  router.push(router);
                }}
              >
                {step.label}
              </StepButton>
            </Step>
          ))}
        </Stepper>
      </Grid> */}
      <Grid item xs={10} sx={{ height: "100%" }}>
        <div></div>
        <div>{steps[activeStep]?.table()}</div>
      </Grid>
    </Grid>
  );
}

export default Dashboard;