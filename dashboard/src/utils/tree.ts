import type {
  AdGroup,
  AdSet,
  Campaign,
  Content,
  ContentType,
  Creative,
  Customset,
  Integration,
  Placement,
  Provider,
  Segment,
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
      contentType: ContentType;
      integrations: (Integration & {
        provider: Provider | null;
        segments: Segment[];
      })[];
      adSets: (AdSet & { segment: Segment | null; content: Content })[];
    })[];
    contentTypes: (ContentType & {
      contents: (Content & { creatives: Creative[] })[];
    })[];
    customsets: Customset[];
    providers: Provider[];
    integrations: (Integration & {
      provider: Provider | null;
      segments: Segment[];
    })[];
  }
): Service & {
  placements: Record<string, ReturnType<typeof buildPlacementTree>>;
  contentTypes: Record<string, ReturnType<typeof buildContentTypeTree>>;
  customsets: Record<string, Customset>;
  providers: Record<string, Provider>;
  integrations: Record<string, ReturnType<typeof buildIntegraionTree>>;
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

  const providers = arrayToRecord(service.providers) as Record<
    string,
    Provider
  >;
  const integrations = arrayToRecord(
    service.integrations.map((integration) => {
      return buildIntegraionTree(integration);
    })
  ) as Record<string, ReturnType<typeof buildIntegraionTree>>;

  return {
    ...service,
    placements,
    contentTypes,
    customsets,
    providers,
    integrations,
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
    contentType: ContentType;
    integrations: (Integration & {
      provider: Provider | null;
      segments: Segment[];
    })[];
    adSets: (AdSet & { segment: Segment | null; content: Content })[];
  }
): Placement & {
  campaigns: Record<string, ReturnType<typeof buildCampaignTree>>;
  contentType: ContentType;
  integrations: Record<string, ReturnType<typeof buildIntegraionTree>>;
  adSets: Record<string, AdSet & { segment: Segment | null; content: Content }>;
} {
  const campaigns = arrayToRecord(
    placement.campaigns.map((campaign) => {
      return buildCampaignTree(campaign);
    })
  ) as Record<string, ReturnType<typeof buildCampaignTree>>;

  const integrations = arrayToRecord(
    placement.integrations.map((integration) => {
      return buildIntegraionTree(integration);
    })
  ) as Record<string, ReturnType<typeof buildIntegraionTree>>;

  const adSets = arrayToRecord(placement.adSets) as Record<
    string,
    AdSet & { segment: Segment | null; content: Content }
  >;
  return { ...placement, campaigns, integrations, adSets };
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
  customsets: Customset[]
): Record<string, Customset> {
  return arrayToRecord(customsets) as Record<string, Customset>;
}
export function buildIntegraionTree(
  integration: Integration & {
    provider: Provider | null;
    segments: Segment[];
  }
): Integration & {
  provider: Provider | null;
  segments: ReturnType<typeof buildSegmentTree>;
} {
  const segments = buildSegmentTree(integration.segments);
  return { ...integration, segments };
}

export function buildSegmentTree(segments: Segment[]): Record<string, Segment> {
  return arrayToRecord(segments) as Record<string, Segment>;
}
