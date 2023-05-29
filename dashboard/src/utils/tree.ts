import type {
  AdGroup,
  Campaign,
  Content,
  ContentType,
  ContentTypeInfo,
  Creative,
  Cube,
  CubeHistory,
  Customset,
  CustomsetInfo,
  Integration,
  Placement,
  Provider,
  Service,
  ServiceConfig,
} from "@prisma/client";

type Item = {
  id: string;
  [k: string]: unknown;
};

function arrayToRecord(array?: Item[]): Record<string, unknown> {
  return (array || []).reduce((prev, current) => {
    prev[current.id] = current;
    return prev;
  }, {} as Record<string, unknown>);
}

export function buildServiceTree(
  service: Service & {
    placements: (Placement & {
      campaigns: (Campaign & {
        adGroups: (AdGroup & {
          creatives: (Creative & {
            content: Content;
          })[];
        })[];
      })[];
      contentType: ContentType | null;
      integrations: Integration[];
    })[];
    contentTypes: (ContentType & {
      contentTypeInfo: ContentTypeInfo | null;
      contents: (Content & { creatives: Creative[] })[];
    })[];
    customsets: (Customset & { customsetInfo: CustomsetInfo })[];
    serviceConfig:
      | (ServiceConfig & {
          cubes: (Cube & { cubeHistories: CubeHistory[] })[];
        })
      | null;
    providers: Provider[];
  }
): Service & {
  placements: Record<string, ReturnType<typeof buildPlacementTree>>;
  contentTypes: Record<string, ReturnType<typeof buildContentTypeTree>>;
  customsets: Record<string, Customset & { customsetInfo: CustomsetInfo }>;
  serviceConfig: ReturnType<typeof buildServiceConfigTree>;
  providers: Record<string, Provider>;
} {
  const placements = arrayToRecord(
    service.placements.map((placement) => {
      return buildPlacementTree(placement);
    })
  ) as Record<string, ReturnType<typeof buildPlacementTree>>;

  const contentTypes = arrayToRecord(
    service.contentTypes.map((contentType) => {
      return buildContentTypeTree(contentType);
    })
  ) as Record<string, ReturnType<typeof buildContentTypeTree>>;

  const customsets = buildCustomsetsTree(service.customsets);

  const serviceConfig = buildServiceConfigTree(service.serviceConfig);

  const providers = buildProviderTree(service.providers);

  return {
    ...service,
    placements,
    contentTypes,
    customsets,
    serviceConfig,
    providers,
  };
}

export function buildPlacementTree(
  placement: Placement & {
    campaigns: (Campaign & {
      adGroups: (AdGroup & {
        creatives: (Creative & {
          content: Content;
        })[];
      })[];
    })[];
    contentType: ContentType | null;
    provider: Provider | null;
    integrations: Integration[];
  }
): Placement & {
  campaigns: Record<string, ReturnType<typeof buildCampaignTree>>;
  contentType: ContentType | null;
  provider: Provider | null;
  integrations: ReturnType<typeof buildIntegraionTree>;
} {
  const campaigns = arrayToRecord(
    placement.campaigns.map((campaign) => {
      return buildCampaignTree(campaign);
    })
  ) as Record<string, ReturnType<typeof buildCampaignTree>>;

  const integrations = buildIntegraionTree(placement.integrations);

  return { ...placement, campaigns, integrations };
}

export function buildCampaignTree(
  campaign: Campaign & {
    adGroups: (AdGroup & {
      creatives: (Creative & {
        content: Content;
      })[];
    })[];
  }
): Campaign & {
  adGroups: Record<string, ReturnType<typeof buildAdGroupTree>>;
} {
  const adGroups = arrayToRecord(
    campaign.adGroups.map((adGroup) => {
      return buildAdGroupTree(adGroup);
    })
  ) as Record<string, ReturnType<typeof buildAdGroupTree>>;

  return { ...campaign, adGroups };
}

export function buildAdGroupTree(
  adGroup: AdGroup & {
    creatives: (Creative & {
      content: Content;
    })[];
  }
): AdGroup & {
  creatives: Record<
    string,
    Creative & {
      content: Content;
    }
  >;
} {
  const creatives = arrayToRecord(adGroup.creatives) as Record<
    string,
    typeof adGroup.creatives[0]
  >;

  return { ...adGroup, creatives };
}
export function buildContentTypesTree(
  contentTypes: (ContentType & {
    contentTypeInfo: ContentTypeInfo | null;
    contents: (Content & { creatives: Creative[] })[];
  })[]
): Record<string, ReturnType<typeof buildContentTypeTree>> {
  return arrayToRecord(
    contentTypes.map((contentType) => {
      return buildContentTypeTree(contentType);
    })
  ) as Record<string, ReturnType<typeof buildContentTypeTree>>;
}

export function buildContentTypeTree(
  contentType: ContentType & {
    contentTypeInfo: ContentTypeInfo | null;
    contents: (Content & { creatives: Creative[] })[];
  }
): ContentType & {
  contentTypeInfo: ContentTypeInfo | null;
  contents: Record<string, Content & { creatives: Creative[] }>;
} {
  const contents = arrayToRecord(contentType.contents) as Record<
    string,
    typeof contentType.contents[0]
  >;

  return { ...contentType, contents };
}

export function buildCustomsetsTree(
  customsets: (Customset & { customsetInfo: CustomsetInfo })[]
): Record<string, Customset & { customsetInfo: CustomsetInfo }> {
  return arrayToRecord(customsets) as Record<
    string,
    Customset & { customsetInfo: CustomsetInfo }
  >;
}

export function buildCubeTree(
  cube: Cube & { cubeHistories: CubeHistory[] }
): Cube & { cubeHistories: Record<string, CubeHistory> } {
  const cubeHistories = arrayToRecord(cube.cubeHistories) as Record<
    string,
    CubeHistory
  >;
  return { ...cube, cubeHistories };
}

export function buildServiceConfigTree(
  serviceConfig:
    | (ServiceConfig & {
        cubes: (Cube & { cubeHistories: CubeHistory[] })[];
      })
    | null
):
  | (ServiceConfig & {
      cubes: Record<string, ReturnType<typeof buildCubeTree>>;
    })
  | null {
  const cubes = arrayToRecord(
    serviceConfig?.cubes.map((cube) => {
      return buildCubeTree(cube);
    })
  ) as Record<string, ReturnType<typeof buildCubeTree>>;

  return serviceConfig ? { ...serviceConfig, cubes } : null;
}

export function buildIntegraionTree(
  integrations: Integration[]
): Record<string, Integration> {
  return arrayToRecord(integrations) as Record<string, Integration>;
}

export function buildProviderTree(
  providers: Provider[]
): Record<string, Provider> {
  return arrayToRecord(providers) as Record<string, Provider>;
}
