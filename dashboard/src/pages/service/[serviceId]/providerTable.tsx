import type { Placement, Service } from "@prisma/client";
import { useRouter } from "next/router";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import type { buildServiceTree } from "../../../utils/tree";
import ProviderModal from "../../../components/form/providerModal";
import Badge from "../../../components/common/Badge";

function ProviderTable({
  service,
  serviceTree,
  setServiceTree,
}: {
  service: Service & { placements: Placement[] };
  serviceTree?: ReturnType<typeof buildServiceTree>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  const router = useRouter();
  const [type, setType] = useState<string | undefined>(undefined);
  const [name, setName] = useState<string | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);

  // const { mutate: deleteProvider } = api.service.removeProvider.useMutation({
  //   onSuccess(deleted) {
  //     setServiceTree((prev) => {
  //       if (!prev) return undefined;
  //       prev.providers = buildProviderTree(deleted.providers);
  //       return prev;
  //     });
  //     setModalOpen(false);
  //   },
  // });
  const getProvider = (type: string, name: string) => {
    return Object.values(serviceTree?.providers || {}).find(
      (provider) => provider.type === type && provider.name === name
    );
  };
  const currentProvider = Object.values(serviceTree?.providers || {}).find(
    (provider) => provider.name === name
  );
  const typeNames = {
    SMS: ["SOLAPI", "COOLSMS"],
  };
  return (
    <>
      <div>
        {Object.entries(typeNames).map(([type, names]) => {
          return (
            <>
              <div key={type} className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {type}
                </h3>
              </div>
              <ul>
                {names.map((name) => {
                  return (
                    <li key={`${type}_${name}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setType(type);
                          setName(name);
                          setModalOpen(true);
                        }}
                      >
                        {name}
                        {getProvider(type, name)?.status === "PUBLISHED" ? (
                          <Badge variant="success" label="active" />
                        ) : (
                          <></>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          );
        })}
      </div>
      <ProviderModal
        key="providertModal"
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        service={service}
        setServiceTree={setServiceTree}
        initialData={currentProvider}
        name={name}
        type={type}
      />
    </>
  );
}

export default ProviderTable;
