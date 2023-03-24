import { BsChevronRight } from "react-icons/bs";

function Breadcrumb({ paths }: { paths: JSX.Element[] }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="flex">
        <ol
          role="list"
          className="flex overflow-hidden rounded-lg border border-gray-200 text-gray-600"
        >
          {paths.map((path, index) => (
            <li key={index} className="flex items-center">
              <span className="ml-2 text-xs font-medium">{path}</span>
              {index != paths.length - 1 && <BsChevronRight className="pl-1" />}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

export default Breadcrumb;
