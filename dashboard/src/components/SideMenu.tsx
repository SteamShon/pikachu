import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import {
  AiFillEnvironment,
  AiOutlineApi,
  AiOutlineSchedule,
} from "react-icons/ai";
import { BiGitMerge, BiSitemap } from "react-icons/bi";
import { BsArrowLeftShort, BsChevronDown, BsDatabase } from "react-icons/bs";
import { GiBullseye } from "react-icons/gi";
import { GrGroup, GrResources } from "react-icons/gr";
function SideMenu() {
  const router = useRouter();
  const { serviceId } = router.query;
  type Menu = {
    title: string;
    icon: JSX.Element;
    link: string;
    subMenus?: Menu[];
  };
  const menus: Menu[] = [
    {
      title: "contentType",
      icon: <BsDatabase />,
      link: `/service/${serviceId}/dashboard?step=contentTypes`,
      subMenus: [
        {
          title: "contents",
          icon: <GrResources />,
          link: `/service/${serviceId}/dashboard?step=contents`,
        },
      ],
    },
    // {
    //   title: "cube",
    //   icon: <BsTable />,
    //   link: `/service/${serviceId}/dashboard?step=cubes`,
    //   subMenus: [
    //     {
    //       title: "segments",
    //       icon: <AiOutlineUsergroupAdd />,
    //       link: `/service/${serviceId}/dashboard?step=segments`,
    //     },
    //   ],
    // },
    {
      title: "placement",
      icon: <BiSitemap />,
      link: `/service/${serviceId}/dashboard?step=placements`,
      subMenus: [
        {
          title: "adSets",
          icon: <GiBullseye />,
          link: `/service/${serviceId}/dashboard?step=adSets`,
        },
        // {
        //   title: "campaign",
        //   icon: <GiBullseye />,
        //   link: `/service/${serviceId}/dashboard?step=campaigns`,
        // },
        // {
        //   title: "adGroup",
        //   icon: <GrGroup />,
        //   link: `/service/${serviceId}/dashboard?step=adGroups`,
        // },
        // {
        //   title: "creative",
        //   icon: <AiOutlinePicture />,
        //   link: `/service/${serviceId}/dashboard?step=creatives`,
        // },
      ],
    },
    {
      title: "providers",
      icon: <AiOutlineApi />,
      link: `/service/${serviceId}/dashboard?step=providers`,
      subMenus: [
        {
          title: "integrations",
          icon: <BiGitMerge />,
          link: `/service/${serviceId}/dashboard?step=integrations`,
          subMenus: [
            {
              title: "segments",
              icon: <GrGroup />,
              link: `/service/${serviceId}/dashboard?step=segments`,
            },
            {
              title: "jobs",
              icon: <AiOutlineSchedule />,
              link: `/service/${serviceId}/dashboard?step=jobs`,
            },
          ],
        },
      ],
    },
  ];

  const [open, setOpen] = useState(true);
  const [openedSubMenus, setOpenedSubMenus] = useState(
    menus.map(({ title }) => title)
  );
  const renderMenus = (menus: Menu[]): JSX.Element => {
    return (
      <div
        className={`relative h-screen ${
          open ? "w-72" : "w-[4.5rem]"
        } bg-slate-200 p-1 pt-8 duration-300`}
      >
        <BsArrowLeftShort
          className={`text-purple absolute -right-3 top-9 rounded-full border border-slate-400 bg-white text-3xl  ${
            !open && "rotate-180"
          }`}
          onClick={() => setOpen(!open)}
        />
        <div className="inline-flex">
          <AiFillEnvironment
            className={`float-left mr-2 block cursor-pointer rounded text-4xl`}
          />
          <h1
            className={`origin-left text-2xl font-medium text-gray-700 ${
              !open && "scale-0"
            }`}
          >
            Pikachu
          </h1>
        </div>
        <ul className={`pt-2`}>
          {menus.map((menu) => {
            return renderMenu(menu);
          })}
        </ul>
      </div>
    );
  };
  const renderMenu = (menu: Menu): JSX.Element => {
    return (
      <>
        <li
          key={menu.title}
          className={`mt-2 flex cursor-pointer items-center gap-x-4 rounded-md p-2 text-sm text-gray-700 hover:bg-slate-50 ${"mt-2"}`}
        >
          <Link href={menu.link}>
            <span className={`float-left block text-2xl`}>{menu.icon}</span>
            <span
              className={`flex-1 pl-2 text-base font-medium duration-200 ${
                !open && "hidden"
              } ${open && "ml-4"}`}
            >
              {menu.title}
            </span>
          </Link>
        </li>
        {(menu?.subMenus || []).map((subMenu) => {
          return (
            <div key={subMenu.title} className="ml-4">
              {renderMenu(subMenu)}
            </div>
          );
        })}
      </>
    );
  };
  return <>{renderMenus(menus)}</>;
}

export default SideMenu;
