import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TreeItem from "@mui/lab/TreeItem";
import TreeView from "@mui/lab/TreeView";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

type Node = {
  id: string;
  name: string;
  children?: Node[];
};
const treeData = [
  {
    id: "PlacementGroups",
    name: "PlacementGroups",
    children: [
      {
        id: "Placements",
        name: "Placements",
        children: [
          {
            id: "Campaigns",
            name: "Campaigns",
            children: [
              {
                id: "AdGroups",
                name: "AdGroups",
                children: [
                  {
                    id: "Creatives",
                    name: "Creatives",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "ContentTypes",
    name: "ContentTypes",
    children: [
      {
        id: "Contents",
        name: "Contents",
      },
    ],
  },
  {
    id: "Customsets",
    name: "Customsets",
  },
];
function SideMenu() {
  const router = useRouter();
  const { step } = router.query;
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (step) setSelected([step as string]);
  }, [step]);

  const handleNodeSelect = (event: React.SyntheticEvent, nodeId: string[]) => {
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, step: nodeId as unknown as string },
      },
      undefined,
      {}
    );
  };

  const allNodeIds = (nodes: Node[]): string[] => {
    return nodes.flatMap((node) => {
      if (!node.children) return [node.id];

      const subIds = node.children.flatMap((child) => {
        return allNodeIds([child]);
      });

      return [node.id, ...subIds];
    });
  };

  const renderTree = (nodes: Node[]) => {
    return nodes.map((node) => {
      return (
        <TreeItem
          key={node.id}
          nodeId={node.id}
          label={
            <div className="px-3 py-2 text-sm font-medium text-black">
              {node.name}
            </div>
          }
          // sx={{ border: "1px dashed grey", fill: "red" }}
        >
          {Array.isArray(node.children)
            ? node.children.flatMap((child) => renderTree([child]))
            : null}
        </TreeItem>
      );
    });
  };

  return (
    <TreeView
      aria-label="file system navigator"
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      expanded={allNodeIds(treeData)}
      selected={selected}
      onNodeSelect={handleNodeSelect}
      sx={{ overflowY: "auto", height: "100%" }}
      className="bg-blue-50"
    >
      {renderTree(treeData)}
    </TreeView>
  );
}

export default SideMenu;
