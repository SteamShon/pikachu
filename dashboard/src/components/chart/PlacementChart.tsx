import type {
  AdGroup,
  Campaign,
  Creative,
  CreativeStat,
  Placement,
} from "@prisma/client";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useState } from "react";
import { Line } from "react-chartjs-2";
import Datepicker from "react-tailwindcss-datepicker";
import type { DateValueType } from "react-tailwindcss-datepicker/dist/types";
import { buildDatasets, defaultDateRange } from "../../utils/chart";
import { AiFillStepForward, AiFillStepBackward } from "react-icons/ai";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function PlacementChart({
  creativeStats,
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
}) {
  const [dateRange, setDateRange] = useState<DateValueType>(defaultDateRange());
  const [limit, setLimit] = useState(3);
  const [counter, setCounter] = useState(0);

  const { labels, datasets, numOfLabels } = buildDatasets({
    startDate: dateRange?.startDate as string,
    endDate: dateRange?.endDate as string,
    creativeStats,
    offset: counter * limit,
    limit,
  });

  const data = {
    labels,
    datasets,
  };
  const options = {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: `Showing top ${counter * limit} ~ ${
          (counter + 1) * limit
        } creatives statistics. total labels = ${numOfLabels}`,
      },
    },
  };
  console.log(data);

  const handleValueChange = (newValue: DateValueType) => {
    if (!newValue?.startDate || !newValue?.endDate) {
      return;
    }
    const newRange = {
      startDate: new Date(newValue?.startDate),
      endDate: new Date(newValue?.endDate),
    };
    console.log("newValue:", newRange);
    setDateRange(newRange);
  };

  //increase counter
  const showIncrease = (counter + 1) * limit >= numOfLabels ? false : true;
  const showDecrease = counter == 0 ? false : true;

  const increase = () => {
    if (!showIncrease) return;
    setCounter((count) => count + 1);
  };

  //decrease counter
  const decrease = () => {
    if (!showDecrease) return;
    setCounter((count) => count - 1);
  };

  //reset counter
  const reset = () => {
    setCounter(0);
  };

  return (
    <>
      <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
        <div className="inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm">
          <select
            className="inline-flex gap-2 rounded-md px-4 py-2 text-sm text-gray-500 hover:text-gray-700 focus:relative"
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value={3}>3</option>
            <option value={5}>5</option>
            <option value={10}>10</option>
          </select>
        </div>
        <div className="inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm">
          <button
            className="inline-flex gap-2 rounded-md px-4 py-2 text-sm text-gray-500 hover:text-gray-700 focus:relative"
            onClick={increase}
          >
            <AiFillStepForward />
          </button>
        </div>
        <div className="inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm">
          <button
            className="inline-flex gap-2 rounded-md px-4 py-2 text-sm text-gray-500 hover:text-gray-700 focus:relative"
            onClick={decrease}
          >
            <AiFillStepBackward />
          </button>
        </div>

        <div className="inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm">
          <Datepicker
            value={dateRange}
            onChange={handleValueChange}
            showShortcuts
          />
        </div>
      </div>

      <br />
      <Line options={options} data={data} />
    </>
  );
}

export default PlacementChart;
