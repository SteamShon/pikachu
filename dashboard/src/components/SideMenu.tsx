import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import {
  AiFillEnvironment,
  AiOutlinePicture,
  AiOutlineApi,
} from "react-icons/ai";
import { BiSitemap } from "react-icons/bi";
import {
  BsArrowLeftShort,
  BsChevronDown,
  BsDatabase,
  BsTable,
} from "react-icons/bs";
import { CiBullhorn } from "react-icons/ci";
import { GiBullseye } from "react-icons/gi";
import { GrGroup, GrResources } from "react-icons/gr";
import { HiTemplate } from "react-icons/hi";
function SideMenu() {
  const router = useRouter();
  const { serviceId } = router.query;
  const menus = [
    {
      title: "publisher",
      icon: <HiTemplate />,
      link: "#",
      subMenus: [
        {
          title: "contentType",
          icon: <BsDatabase />,
          link: `/service/${serviceId}/dashboard?step=ContentTypes`,
        },
        {
          title: "cube",
          icon: <BsTable />,
          link: `/service/${serviceId}/dashboard?step=Cubes`,
        },
        {
          title: "placement",
          icon: <BiSitemap />,
          link: `/service/${serviceId}/dashboard?step=Placements`,
        },
        {
          title: "integration",
          icon: <AiOutlineApi />,
          link: `/service/${serviceId}/dashboard?step=Integrations`,
        },
      ],
    },
    {
      title: "advertiser",
      icon: <CiBullhorn />,
      link: "#",
      subMenus: [
        {
          title: "contents",
          icon: <GrResources />,
          link: `/service/${serviceId}/dashboard?step=Contents`,
        },
        {
          title: "campaign",
          icon: <GiBullseye />,
          link: `/service/${serviceId}/dashboard?step=Campaigns`,
        },
        {
          title: "adGroup",
          icon: <GrGroup />,
          link: `/service/${serviceId}/dashboard?step=AdGroups`,
        },
        {
          title: "creative",
          icon: <AiOutlinePicture />,
          link: `/service/${serviceId}/dashboard?step=Creatives`,
        },
      ],
      spacing: true,
    },
  ];

  const [open, setOpen] = useState(true);
  const [openedSubMenus, setOpenedSubMenus] = useState(
    menus.map(({ title }) => title)
  );

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
        {menus.map((menu, index) => (
          <>
            <li
              key={index}
              className={`mt-2 flex cursor-pointer items-center gap-x-4 rounded-md p-2 text-sm text-gray-700 hover:bg-slate-50 ${
                menu.spacing ? "mt-2" : "mt-2"
              }`}
            >
              <Link href={menu.link}>
                <span className={`float-left block text-2xl`}>{menu.icon}</span>
                <span
                  className={`flex-1 pl-2 text-base font-medium duration-200 ${
                    !open && "hidden"
                  }`}
                >
                  {menu.title}
                </span>
              </Link>
              {menu.subMenus && open && (
                <BsChevronDown
                  className={`${
                    openedSubMenus.find((m) => m === menu.title) && "rotate-180"
                  }`}
                  onClick={() =>
                    setOpenedSubMenus((prev) =>
                      prev.find((m) => m === menu.title)
                        ? prev.filter((m) => m !== menu.title)
                        : [menu.title, ...prev]
                    )
                  }
                />
              )}
            </li>
            {menu.subMenus && openedSubMenus.find((m) => m === menu.title) && (
              <ul>
                {menu.subMenus.map((subMenu, index) => (
                  <li
                    key={index}
                    className={`mt-2 flex cursor-pointer items-center gap-x-4 rounded-md p-2 text-sm text-gray-700 hover:bg-slate-50 ${
                      menu.spacing ? "mt-2" : "mt-2"
                    } ${open && "ml-4"}`}
                  >
                    <Link href={subMenu.link}>
                      <span className={`float-left block text-2xl`}>
                        {subMenu.icon}
                      </span>
                      <span
                        className={`flex-1 pl-2 text-base font-medium duration-200 ${
                          !open && "hidden"
                        }`}
                      >
                        {subMenu.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        ))}
      </ul>
    </div>
  );
}

export default SideMenu;
