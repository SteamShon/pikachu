import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Breadcrumb from "../../../components/Breadcrumb";
import ServiceMenu from "../../../components/ServiceMenu";
import SideMenu from "../../../components/SideMenu";
import Loading from "../../../components/common/Loading";
import { api } from "../../../utils/api";
import { buildServiceTree } from "../../../utils/tree";
import AdGroupTable from "./adGroupTable";
import CampaignTable from "./campaignTable";
import ContentTable from "./contentTable";
import ContentTypeTable from "./contentTypeTable";
import CreativeTable from "./creativeTable";
// import CubeTable from "./cubeTable";
import CustomsetTable from "./customsetTable";
import AdGroupMenu from "../../../components/AdGroupMenu";
import CampaignMenu from "../../../components/CampaignMenu";
import ContentTypeMenu from "../../../components/ContentTypeMenu";
import PlacementMenu from "../../../components/PlacementMenu";
import IntegrationTable from "./integrationTable";
import PlacementTable from "./placementTable";
import RenderPreview from "./renderPreview";

function Dashboard() {
  const router = useRouter();

  const { serviceId, step } = router.query;

  const [tree, setTree] = useState<
    ReturnType<typeof buildServiceTree> | undefined
  >(undefined);

  const { data: service, isLoading } = api.service.get.useQuery(
    {
      id: serviceId as string,
    }
    // {
    //   refetchOnWindowFocus: false,
    // }
  );

  useEffect(() => {
    if (service) {
      setTree(buildServiceTree(service));
    }
  }, [service]);

  const PlacementContentTypeMenu = () => {
    const value = ["ContentTypes", "Contents"].find((c) => c === step)
      ? "ContentTypes"
      : "Placements";
    return (
      <select
        onChange={(e) => {
          router.push({
            pathname: router.pathname,
            query: { ...router.query, step: e.target.value },
          });
        }}
        value={value}
      >
        <option value="Placements">Placement</option>
        <option value="ContentTypes">ContentType</option>
      </select>
    );
  };

  const steps = [
    {
      label: "placements",
      description: `placements`,
      paths: [
        <>Home</>,
        <ServiceMenu key="serviceMenu" />,
        <>{PlacementContentTypeMenu()}</>,
        <>
          <Link
            href={{
              pathname: `/service/[serviceId]/dashboard`,
              query: { ...router.query, step: "campaigns" },
            }}
          >
            Campaign
          </Link>
        </>,
      ],
      table: () =>
        service ? (
          <PlacementTable
            service={service}
            setServiceTree={setTree}
            serviceTree={tree}
          />
        ) : null,
    },
    {
      label: "campaigns",
      description: `campaigns`,
      paths: [
        <>Home</>,
        <ServiceMenu key="serviceMenu" />,
        <>{PlacementContentTypeMenu()}</>,
        <PlacementMenu key="placementMenu" />,
        <>
          <Link
            href={{
              pathname: `/service/[serviceId]/dashboard`,
              query: { ...router.query, step: "campaigns" },
            }}
          >
            <span className="font-bold">Campaign</span>
          </Link>
        </>,
        <>
          <Link
            href={{
              pathname: `/service/[serviceId]/dashboard`,
              query: { ...router.query, step: "adGroups" },
            }}
          >
            AdGroup
          </Link>
        </>,
      ],
      table: () =>
        service ? (
          <CampaignTable
            service={service}
            setServiceTree={setTree}
            serviceTree={tree}
          />
        ) : null,
    },
    {
      label: "adGroups",
      description: `adGroups`,
      paths: [
        <>Home</>,
        <ServiceMenu key="serviceMenu" />,
        <>{PlacementContentTypeMenu()}</>,
        <PlacementMenu key="placementMenu" />,
        <>
          <Link
            href={{
              pathname: `/service/[serviceId]/dashboard`,
              query: { ...router.query, step: "campaigns" },
            }}
          >
            Campaign
          </Link>
        </>,
        <CampaignMenu key="campaignMenu" />,
        <>
          <Link
            href={{
              pathname: `/service/[serviceId]/dashboard`,
              query: { ...router.query, step: "adGroups" },
            }}
          >
            <span className="font-bold">AdGroup</span>
          </Link>
        </>,
        <>
          <Link
            href={{
              pathname: `/service/[serviceId]/dashboard`,
              query: { ...router.query, step: "creatives" },
            }}
          >
            Creative
          </Link>
        </>,
      ],
      table: () =>
        service && tree ? (
          <AdGroupTable
            service={service}
            setServiceTree={setTree}
            serviceTree={tree}
          />
        ) : null,
    },
    {
      label: "creatives",
      description: `creatives`,
      paths: [
        <>Home</>,
        <ServiceMenu key="serviceMenu" />,
        <>{PlacementContentTypeMenu()}</>,
        <PlacementMenu key="placementMenu" />,
        <>
          <Link
            href={{
              pathname: `/service/[serviceId]/dashboard`,
              query: { ...router.query, step: "campaigns" },
            }}
          >
            Campaign
          </Link>
        </>,
        <CampaignMenu key="campaignMenu" />,
        <>
          <Link
            href={{
              pathname: `/service/[serviceId]/dashboard`,
              query: { ...router.query, step: "adGroups" },
            }}
          >
            AdGroup
          </Link>
        </>,
        <AdGroupMenu key="adGroupMenu" />,
        <>
          <Link
            href={{
              pathname: `/service/[serviceId]/dashboard`,
              query: { ...router.query, step: "creatives" },
            }}
          >
            <span className="font-bold">Creative</span>
          </Link>
        </>,
        <>
          <Link
            href={{
              pathname: `/service/[serviceId]/dashboard`,
              query: { ...router.query, step: "contents" },
            }}
          >
            Content
          </Link>
        </>,
      ],
      table: () =>
        service ? (
          <CreativeTable
            service={service}
            setServiceTree={setTree}
            serviceTree={tree}
          />
        ) : null,
    },
    {
      label: "contentTypes",
      description: `contentTypes`,
      paths: [
        <>Home</>,
        <ServiceMenu key="serviceMenu" />,
        <>{PlacementContentTypeMenu()}</>,
        <>
          <Link
            href={{
              pathname: `/service/[serviceId]/dashboard`,
              query: { ...router.query, step: "contents" },
            }}
          >
            Content
          </Link>
        </>,
      ],
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
      label: "contents",
      description: `contents`,
      paths: [
        <>Home</>,
        <ServiceMenu key="serviceMenu" />,
        <>{PlacementContentTypeMenu()}</>,
        <ContentTypeMenu key="contentTypeMenu" />,
        <>
          <Link
            href={{
              pathname: `/service/[serviceId]/dashboard`,
              query: { ...router.query, step: "contents" },
            }}
          >
            <span className="font-bold">Content</span>
          </Link>
        </>,
        <>
          <Link
            href={{
              pathname: `/service/[serviceId]/dashboard`,
              query: { ...router.query, step: "creatives" },
            }}
          >
            Creative
          </Link>
        </>,
      ],
      table: () =>
        service ? (
          <ContentTable
            service={service}
            setServiceTree={setTree}
            serviceTree={tree}
          />
        ) : null,
    },
    {
      label: "customsets",
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
    // {
    //   label: "cubes",
    //   description: `cubes`,
    //   table: () =>
    //     service ? (
    //       <CubeTable
    //         service={service}
    //         setServiceTree={setTree}
    //         serviceTree={tree}
    //       />
    //     ) : null,
    // },
    {
      label: "renderPreview",
      description: `renderPreview`,
      table: () => (service ? <RenderPreview service={service} /> : null),
    },
    {
      label: "integrations",
      description: `integrations`,
      paths: [
        <>Home</>,
        <ServiceMenu key="serviceMenu" />,
        <>{PlacementContentTypeMenu()}</>,
        <PlacementMenu key="placementMenu" />,
        <>
          <Link
            href={{
              pathname: `/service/[serviceId]/dashboard`,
              query: { ...router.query, step: "integrations" },
            }}
          >
            <span className="font-bold">Integration</span>
          </Link>
        </>,
      ],
      table: () =>
        service ? (
          <IntegrationTable
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
    <div className="flex overflow-auto">
      <SideMenu />
      <div className="w-full p-4">
        <div className="mt-2">
          <Breadcrumb paths={steps[activeStep]?.paths || []} />
        </div>
        <div className="mt-5">{steps[activeStep]?.table()}</div>
      </div>
    </div>
  );
}

export default Dashboard;
