import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Breadcrumb from "../../../components/Breadcrumb";
import Loading from "../../../components/common/Loading";
import ServiceMenu from "../../../components/ServiceMenu";
import SideMenu from "../../../components/SideMenu";
import { api } from "../../../utils/api";
import { buildServiceTree } from "../../../utils/tree";
import AdGroupTable from "./adGroupTable";
import CampaignTable from "./campaignTable";
import ContentTable from "./contentTable";
import ContentTypeTable from "./contentTypeTable";
import CreativeTable from "./creativeTable";
import CubeTable from "./cubeTable";
import CustomsetTable from "./customsetTable";

import PlacementTable from "./placementTable";
import RenderPreview from "./renderPreview";
import { usePostHog } from "posthog-js/react";
import { useSession } from "next-auth/react";
import PlacementMenu from "../../../components/PlacementMenu";
import CampaignMenu from "../../../components/CampaignMenu";
import ContentTypeMenu from "../../../components/ContentTypeMenu";
import AdGroupMenu from "../../../components/AdGroupMenu";
function Dashboard() {
  const { data: session } = useSession();
  const posthog = usePostHog();
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
    posthog?.identify(session?.user?.id);
    const eventName = activeStep
      ? steps[activeStep]?.label.toLocaleLowerCase()
      : "";
    posthog?.capture(`dashboard_${eventName}_visited`, {
      service: service?.name,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      label: "Placements",
      description: `placements`,
      paths: [
        <>Home</>,
        <ServiceMenu key="serviceMenu" />,
        <>{PlacementContentTypeMenu()}</>,
        <>
          <Link
            href={{
              pathname: `/service/[serviceId]/dashboard`,
              query: { ...router.query, step: "Campaigns" },
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
      label: "Campaigns",
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
              query: { ...router.query, step: "Campaigns" },
            }}
          >
            <span className="font-bold">Campaign</span>
          </Link>
        </>,
        <>
          <Link
            href={{
              pathname: `/service/[serviceId]/dashboard`,
              query: { ...router.query, step: "AdGroups" },
            }}
          >
            AdGroup
          </Link>
        </>,
      ],
      table: () =>
        service ? (
          <CampaignTable setServiceTree={setTree} serviceTree={tree} />
        ) : null,
    },
    {
      label: "AdGroups",
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
              query: { ...router.query, step: "Campaigns" },
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
              query: { ...router.query, step: "AdGroups" },
            }}
          >
            <span className="font-bold">AdGroup</span>
          </Link>
        </>,
        <>
          <Link
            href={{
              pathname: `/service/[serviceId]/dashboard`,
              query: { ...router.query, step: "Creatives" },
            }}
          >
            Creative
          </Link>
        </>,
      ],
      table: () =>
        service && tree ? (
          <AdGroupTable setServiceTree={setTree} serviceTree={tree} />
        ) : null,
    },
    {
      label: "Creatives",
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
              query: { ...router.query, step: "Campaigns" },
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
              query: { ...router.query, step: "AdGroups" },
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
              query: { ...router.query, step: "Creatives" },
            }}
          >
            <span className="font-bold">Creative</span>
          </Link>
        </>,
        <>
          <Link
            href={{
              pathname: `/service/[serviceId]/dashboard`,
              query: { ...router.query, step: "Contents" },
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
      label: "ContentTypes",
      description: `contentTypes`,
      paths: [
        <>Home</>,
        <ServiceMenu key="serviceMenu" />,
        <>{PlacementContentTypeMenu()}</>,
        <>
          <Link
            href={{
              pathname: `/service/[serviceId]/dashboard`,
              query: { ...router.query, step: "Contents" },
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
      label: "Contents",
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
              query: { ...router.query, step: "Contents" },
            }}
          >
            <span className="font-bold">Content</span>
          </Link>
        </>,
        <>
          <Link
            href={{
              pathname: `/service/[serviceId]/dashboard`,
              query: { ...router.query, step: "Creatives" },
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
      label: "Cubes",
      description: `cubes`,
      table: () =>
        service ? (
          <CubeTable
            service={service}
            setServiceTree={setTree}
            serviceTree={tree}
          />
        ) : null,
    },

    {
      label: "RenderPreview",
      description: `renderPreview`,
      table: () => (service ? <RenderPreview serviceId={service.id} /> : null),
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
