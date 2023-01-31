import type {
  AdGroup,
  Campaign,
  Content,
  ContentType,
  Creative,
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

function arrayToRecord<Item>(array?: Item[]): Record<string, unknown> {
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
  }
): Service & {
  placementGroups: Record<string, ReturnType<typeof buildPlacementGroupTree>>;
  contentTypes: Record<string, ReturnType<typeof buildContentTypeTree>>;
  customsets: Record<string, Customset & { customsetInfo: CustomsetInfo }>;
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

  return { ...service, placementGroups, contentTypes, customsets };
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
