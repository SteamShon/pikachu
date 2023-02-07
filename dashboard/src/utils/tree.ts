import type {
  AdGroup,
  Campaign,
  Content,
  ContentType,
  Creative,
  Cube,
  CubeConfig,
  Customset,
  CustomsetInfo,
  Placement,
  PlacementGroup,
  Service,
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

export function buildTree(
  services: (Service & {
    placementGroups: (PlacementGroup & {
      placements: (Placement & {
        campaigns: (Campaign & {
          adGroups: (AdGroup & {
            creatives: (Creative & {
              content: Content;
            })[];
          })[];
        })[];
        contentType: ContentType;
      })[];
    })[];
    contentTypes: (ContentType & {
      contents: (Content & { creatives: Creative[] })[];
    })[];
    customsets: (Customset & { customsetInfo: CustomsetInfo })[];
    cubeConfigs: (CubeConfig & { cubes: Cube[] })[];
  })[]
): Record<string, ReturnType<typeof buildServiceTree>> {
  const tree = arrayToRecord(
    services.map((service) => {
      return buildServiceTree(service);
    })
  ) as Record<string, ReturnType<typeof buildServiceTree>>;

  return tree;
}

export function buildServiceTree(
  service: Service & {
    placementGroups: (PlacementGroup & {
      placements: (Placement & {
        campaigns: (Campaign & {
          adGroups: (AdGroup & {
            creatives: (Creative & {
              content: Content;
            })[];
          })[];
        })[];
        contentType: ContentType;
      })[];
    })[];
    contentTypes: (ContentType & {
      contents: (Content & { creatives: Creative[] })[];
    })[];
    customsets: (Customset & { customsetInfo: CustomsetInfo })[];
    cubeConfigs: (CubeConfig & { cubes: Cube[] })[];
  }
): Service & {
  placementGroups: Record<string, ReturnType<typeof buildPlacementGroupTree>>;
  contentTypes: Record<string, ReturnType<typeof buildContentTypeTree>>;
  customsets: Record<string, Customset & { customsetInfo: CustomsetInfo }>;
  cubeConfigs: Record<string, ReturnType<typeof buildCubeConfigTree>>;
} {
  const placementGroups = arrayToRecord(
    service.placementGroups.map((placementGroup) => {
      return buildPlacementGroupTree(placementGroup);
    })
  ) as Record<string, ReturnType<typeof buildPlacementGroupTree>>;

  const contentTypes = arrayToRecord(
    service.contentTypes.map((contentType) => {
      return buildContentTypeTree(contentType);
    })
  ) as Record<string, ReturnType<typeof buildContentTypeTree>>;

  const customsets = buildCustomsetsTree(service.customsets);

  const cubeConfigs = buildCubeConfigsTree(service.cubeConfigs);

  return { ...service, placementGroups, contentTypes, customsets, cubeConfigs };
}

export function buildPlacementGroupTree(
  placementGroup: PlacementGroup & {
    placements: (Placement & {
      campaigns: (Campaign & {
        adGroups: (AdGroup & {
          creatives: (Creative & {
            content: Content;
          })[];
        })[];
      })[];
      contentType: ContentType;
    })[];
  }
): PlacementGroup & {
  placements: Record<string, ReturnType<typeof buildPlacementTree>>;
} {
  const placements = arrayToRecord(
    placementGroup.placements.map((placement) => {
      return buildPlacementTree(placement);
    })
  ) as Record<string, ReturnType<typeof buildPlacementTree>>;

  return { ...placementGroup, placements };
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
    contentType: ContentType;
  }
): Placement & {
  campaigns: Record<string, ReturnType<typeof buildCampaignTree>>;
  contentType: ContentType;
} {
  const campaigns = arrayToRecord(
    placement.campaigns.map((campaign) => {
      return buildCampaignTree(campaign);
    })
  ) as Record<string, ReturnType<typeof buildCampaignTree>>;

  return { ...placement, campaigns };
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
    contents: (Content & { creatives: Creative[] })[];
  }
): ContentType & {
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

export function buildCubeConfigTree(
  cubeConfig: CubeConfig & {
    cubes: Cube[];
  }
): CubeConfig & {
  cubes: Record<string, Cube>;
} {
  const cubes = arrayToRecord(cubeConfig.cubes) as Record<
    string,
    typeof cubeConfig.cubes[0]
  >;

  return { ...cubeConfig, cubes };
}

export function buildCubeConfigsTree(
  cubeConfigs: (CubeConfig & { cubes: Cube[] })[]
): Record<string, ReturnType<typeof buildCubeConfigTree>> {
  return arrayToRecord(
    cubeConfigs.map((cubeConfig) => {
      return buildCubeConfigTree(cubeConfig);
    })
  ) as Record<string, ReturnType<typeof buildCubeConfigTree>>;
}