import { Dialog, DialogContent } from "@mui/material";
// import type { inferRouterOutputs } from "@trpc/server";
// import type { Dispatch, SetStateAction } from "react";
// import type { serviceRouter } from "../../server/api/routers/service";
// import { api } from "../../utils/api";
// import type { buildServiceTree } from "../../utils/tree";
// import { buildProviderTree } from "../../utils/tree";

// import type { ProviderSchemaType } from "../schema/provider";
// import ProviderForm from "./providerForm";

// function ProviderModal({
//   service,
//   initialData,
//   provide,
//   name,
//   modalOpen,
//   setModalOpen,
//   setServiceTree,
// }: {
//   service: Parameters<typeof ProviderForm>[0]["service"];
//   initialData?: Parameters<typeof ProviderForm>[0]["initialData"];
//   provide?: Parameters<typeof ProviderForm>[0]["provide"];
//   name?: Parameters<typeof ProviderForm>[0]["name"];
//   modalOpen: boolean;
//   setModalOpen: Dispatch<SetStateAction<boolean>>;
//   setServiceTree: Dispatch<
//     SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
//   >;
// }) {
//   type RouterOutput = inferRouterOutputs<typeof serviceRouter>;
//   type OutputType = RouterOutput["addProvider"];

//   const handleSuccess = (created: OutputType): void => {
//     setServiceTree((prev) => {
//       if (!prev) return undefined;
//       prev.providers = buildProviderTree(created.providers);
//       return prev;
//     });

//     setModalOpen(false);
//   };
//   const { mutate: create } = api.service.addProvider.useMutation({
//     onSuccess(created) {
//       handleSuccess(created);
//     },
//   });

//   const { mutate: update } = api.service.updateProvider.useMutation({
//     onSuccess(updated) {
//       handleSuccess(updated);
//     },
//   });

//   const onSubmit = (input: ProviderSchemaType) => {
//     if (initialData) update(input);
//     else create(input);
//   };

//   return (
//     <Dialog
//       onClose={() => setModalOpen(false)}
//       open={modalOpen}
//       fullWidth
//       maxWidth="lg"
//     >
//       <DialogContent>
//         <ProviderForm
//           service={service}
//           initialData={initialData}
//           provide={provide}
//           name={name}
//           onSubmit={onSubmit}
//           //onClose={() => setModalOpen(false)}
//         />
//       </DialogContent>
//     </Dialog>
//   );
// }

// export default ProviderModal;
