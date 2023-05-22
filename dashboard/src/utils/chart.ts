import {
  AdGroup,
  Campaign,
  Creative,
  CreativeStat,
  Placement,
} from "@prisma/client";

export function defaultDateRange() {
  const now = new Date();
  const endDate = new Date(now.toDateString());
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 30);
  return { startDate, endDate };
}
export function randomColor(s: string): number[] {
  let hash = 0;

  for (let i = 0; i < s.length; i++) {
    hash = s.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const rgb = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 255;
    rgb[i] = value;
  }
  return rgb;
}

export function getDaysArray(start: Date, end: Date): Date[] {
  const arr = [];
  for (let dt = start; dt <= end; dt.setDate(dt.getDate() + 1)) {
    arr.push(new Date(dt));
  }
  return arr;
}

export function getDaysBetween(end: Date, minusDays: number): Date[] {
  const startDate = new Date(end);
  startDate.setDate(startDate.getDate() - minusDays);
  return [startDate, end];
}
export function getTimeString(date: Date): string {
  return date.toDateString();
}
export function getTotalStat(datasets: Record<string, Record<string, number>>) {
  return Object.entries(datasets).reduce((prev, [label, timeStats]) => {
    const total = Object.values(timeStats).reduce((prev, stat) => {
      return prev + Number(stat);
    }, 0);
    prev[`${label}`] = total;
    return prev;
  }, {} as Record<string, number>);
}

// function mergeCreativeStat(
//   left: {
//     stat: CreativeStat;
//     creative:
//       | (Creative & {
//           adGroup: AdGroup & {
//             campaign: Campaign & {
//               placement: Placement;
//             };
//           };
//         })
//       | undefined;
//   },
//   right: {
//     stat: CreativeStat;
//     creative:
//       | (Creative & {
//           adGroup: AdGroup & {
//             campaign: Campaign & {
//               placement: Placement;
//             };
//           };
//         })
//       | undefined;
//   },
//   groupByKey: "placement" | "campaign" | "adGroup" | "creative"
// ) {
//   if (
//     left.stat.timeUnit !== right.stat.timeUnit ||
//     getTimeString(left.stat.time) !== getTimeString(right.stat.time) ||
//     toLabel({ creativeStat: left, groupByKey }) !==
//       toLabel({ creativeStat: right, groupByKey })
//   ) {
//     return undefined;
//   }

//   return {
//     timeUnit: left.timeUnit,
//     time: new Date(left.time),
//     creativeId: stat.creativeId,
//     impressionCount: stat.impressionCount,
//     clickCount: stat.clickCount,
//     createdAt: stat.createdAt,
//     updatedAt: stat.updatedAt,
//   };
// }
export function buildOthersDataset(
  datasets: Record<string, Record<string, CreativeStat>>
) {
  const others: Record<string, CreativeStat> = {};
  Object.entries(datasets).forEach(([label, timeStats]) => {
    Object.entries(timeStats).forEach(([time, stat]) => {
      if (!others[`${time}`]) {
        others[`${time}`] = {
          timeUnit: stat.timeUnit,
          time: new Date(time),
          creativeId: stat.creativeId,
          impressionCount: stat.impressionCount,
          clickCount: stat.clickCount,
          createdAt: stat.createdAt,
          updatedAt: stat.updatedAt,
        };
      }
      const newStat = others[`${time}`];
      if (!newStat) return;

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      newStat!.impressionCount += stat.impressionCount;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      newStat!.clickCount += stat.clickCount;
    });
  });

  return others;
}
export function filterTopDatasets({
  datasets,
  offset,
  limit,
}: {
  datasets: Record<string, Record<string, number>>;
  offset: number;
  limit: number;
}) {
  const tops = getTotalStat(datasets);
  const start = offset;
  const end = Math.min(start + limit, Object.keys(tops).length);
  const sorted = Object.keys(tops)
    .map((key) => {
      return { key, value: tops[key] || 0 };
    })
    .sort((a, b) => {
      return a.value > b.value ? 1 : b.value > a.value ? -1 : 0;
    })
    .slice(start, end)
    .map((o) => o.key);

  console.log(start, end);
  console.log(tops);
  console.log(sorted);
  const results: Record<string, Record<string, number>> = {};
  const others: Record<string, Record<string, number>> = {};

  Object.entries(datasets).forEach(([label, value]) => {
    if (sorted.includes(label)) {
      results[`${label}`] = value;
    } else {
      others[`${label}`] = value;
    }
  });

  return { include: results, others };
}
export function toLabel({
  creative,
  groupByKey,
}: {
  creative:
    | (Creative & {
        adGroup: AdGroup & {
          campaign: Campaign & {
            placement: Placement;
          };
        };
      })
    | undefined;

  groupByKey: string;
}) {
  switch (groupByKey) {
    case "placement":
      return creative?.adGroup.campaign.placement.name;
    case "campaign":
      return creative?.adGroup.campaign.name;
    case "adGroup":
      return creative?.adGroup.name;
    case "creative":
      return creative?.name;
    default:
      return undefined;
  }
}
export function toMetric({
  counts,
  metricKey,
}: {
  counts: {
    [key: string]: number;
  };
  metricKey: string;
}) {
  switch (metricKey) {
    case "impressionCount":
      return counts.impressionCount;
    case "clickCount":
      return counts.clickCount;
    case "ctr":
      return !counts.impressionCount || counts.impressionCount === 0
        ? 0.0
        : (counts?.clickCount || 0) / counts.impressionCount;
    default:
      return undefined;
  }
}
export function aggregateLabelTimeCounts({
  creativeStats,
  groupByKey,
}: {
  creativeStats: {
    stat: CreativeStat;
    creative:
      | (Creative & {
          adGroup: AdGroup & {
            campaign: Campaign & {
              placement: Placement;
            };
          };
        })
      | undefined;
  }[];
  groupByKey: string;
}): Record<string, Record<string, Record<string, number>>> {
  const topLabels: Record<string, number> = {};
  const labelTimeStats = creativeStats.reduce((prev, { stat, creative }) => {
    const label = toLabel({ creative, groupByKey });

    if (!prev[`${label}`]) {
      prev[`${label}`] = {};
    }
    if (!prev[`${label}`]?.[`${getTimeString(stat.time)}`]) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      prev[`${label}`]![`${getTimeString(stat.time)}`] = {
        impressionCount: 0,
        clickCount: 0,
      };
    }
    const counts = prev[`${label}`]?.[`${getTimeString(stat.time)}`];
    const imp = counts?.impressionCount || 0;
    const clk = counts?.clickCount || 0;
    // const metric = toMetric({ creativeStat: { stat, creative }, metricKey });
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    prev[`${label}`]![`${getTimeString(stat.time)}`] = {
      impressionCount: imp + Number(stat.impressionCount),
      clickCount: clk + Number(stat.clickCount),
    };

    if (!topLabels[`${label}`]) {
      topLabels[`${label}`] = 0;
    }
    topLabels[`${label}`] += Number(imp);

    return prev;
  }, {} as Record<string, Record<string, Record<string, number>>>);

  return labelTimeStats;
}
export function aggregateToMetric({
  aggr,
  metricKey,
}: {
  aggr: Record<string, Record<string, Record<string, number>>>;
  metricKey: string;
}) {
  const metrics: Record<string, Record<string, number>> = {};
  Object.entries(aggr).forEach(([label, timeCounts]) => {
    metrics[`${label}`] = {};
    Object.entries(timeCounts).forEach(([time, counts]) => {
      const value = toMetric({ counts, metricKey }) || 0;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      metrics![`${label}`]![`${time}`] = value;
    });
  });
  return metrics;
}
export function buildDatasets({
  startDate,
  endDate,
  creativeStats,
  groupByKey,
  metricKey,
  offset,
  limit,
}: {
  startDate?: string;
  endDate?: string;
  creativeStats: {
    stat: CreativeStat;
    creative:
      | (Creative & {
          adGroup: AdGroup & {
            campaign: Campaign & {
              placement: Placement;
            };
          };
        })
      | undefined;
  }[];
  groupByKey: string;
  metricKey: string;
  offset?: number;
  limit?: number;
}) {
  if (!startDate || !endDate)
    return { labels: [], datasets: [], numOfLabels: 0 };

  const times = getDaysArray(new Date(startDate), new Date(endDate)).map(
    getTimeString
  );
  const aggregated = aggregateLabelTimeCounts({
    creativeStats,
    groupByKey,
  });
  const labelTimeStats = aggregateToMetric({ aggr: aggregated, metricKey });

  const numOfLabels = Object.keys(labelTimeStats).length;
  const { include: top, others } = filterTopDatasets({
    datasets: labelTimeStats,
    offset: offset || 0,
    limit: limit || 2,
  });
  const datasets = Object.entries(top).map(([label, timeStats]) => {
    const rgb = randomColor(label);
    return {
      label,
      data: times.map((time) => {
        return timeStats[time] || 0;
      }),
      borderWidth: 1,
      borderColor: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
      backgroundColor: `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.5)`,
    };
  });

  return {
    labels: times,
    datasets,
    numOfLabels,
  };
}
