import { useRouter } from "next/router";
import { api } from "../utils/api";

function ContentTypeMenu() {
  const router = useRouter();
  const { serviceId, contentTypeId } = router.query;

  const { data: contentTypes } = api.contentType.list.useQuery({
    serviceId: serviceId as string,
  });

  return (
    <>
      <select
        className="p-1"
        value={contentTypeId}
        onChange={(e) => {
          let query = {};
          if (e.target.value === "" && router.query[contentTypeId as string]) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { contentTypeId, ...rest } = router.query;
            query = rest;
          } else {
            query = { ...router.query, contentTypeId: e.target.value };
          }
          router.push({
            pathname: router.pathname,
            query: query,
          });
        }}
      >
        <option value="">All</option>
        {(contentTypes || []).map((contentType) => (
          <option key={contentType.name} value={contentType.id}>
            {contentType.name}
          </option>
        ))}
      </select>
    </>
  );
}

export default ContentTypeMenu;
