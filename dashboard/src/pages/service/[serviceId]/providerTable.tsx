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
  const [provide, setProvide] = useState<string | undefined>(undefined);
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
  const getProvider = (provide: string, name: string) => {
    return Object.values(serviceTree?.providers || {}).find(
      (provider) => provider.provide === provide && provider.name === name
    );
  };
  const currentProvider = Object.values(serviceTree?.providers || {}).find(
    (provider) => provider.name === name
  );
  const typeNames = {
    API: [{ name: "PIKACHU_API", enabled: true }],
    SMS: [
      { name: "SOLAPI", enabled: true },
      { name: "COOLSMS", enabled: false },
    ],
  };

  return (
    <>
      <div>
        {Object.entries(typeNames).map(([provide, names]) => {
          return (
            <>
              <div key={provide} className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {provide}
                </h3>
              </div>
              <ul className="flex">
                {names.map(({ name, enabled }) => {
                  return (
                    <li key={`${provide}_${name}`}>
                      <button
                        className="relative flex items-start justify-between rounded-xl border border-gray-100 p-4 shadow-xl sm:p-6 lg:p-8"
                        type="button"
                        disabled={!enabled}
                        onClick={() => {
                          setProvide(provide);
                          setName(name);
                          setModalOpen(true);
                        }}
                      >
                        <div className="pt-4 text-gray-500">
                          <h3
                            className={`mt-4 text-lg font-bold text-gray-900 sm:text-xl ${
                              !enabled && "line-through"
                            }`}
                          >
                            {name}
                          </h3>

                          <p className="mt-2 hidden text-sm sm:block"></p>
                        </div>

                        {getProvider(provide, name)?.status === "PUBLISHED" && (
                          <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-medium text-green-600">
                            <Badge variant="success" label="active" />
                          </span>
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
        provide={provide}
      />
    </>
  );
}

export default ProviderTable;
