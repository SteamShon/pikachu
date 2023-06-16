import { Dialog, DialogContent } from "@mui/material";
import type { Service } from "@prisma/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { Dispatch, SetStateAction } from "react";
import type { contentTypeRouter } from "../../../server/api/routers/contentType";
import { api } from "../../../utils/api";
import type { buildServiceTree } from "../../../utils/tree";
import { buildContentTypesTree } from "../../../utils/tree";
import type { ContentTypeSchemaType } from "../../schema/contentType";
import ContentTypeForm from "./contentTypeForm";

function ContentTypeModal({
  service,
  initialData,
  modalOpen,
  setModalOpen,
  setServiceTree,
}: {
  service: Service;
  initialData?: Parameters<typeof ContentTypeForm>[0]["initialData"];
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  type RouterOutput = inferRouterOutputs<typeof contentTypeRouter>;
  type OutputType = RouterOutput["create"];
  const handleSuccess = (created: OutputType): void => {
    setServiceTree((prev) => {
      if (!prev) return prev;

      prev.contentTypes = buildContentTypesTree(created.contentTypes);
      return prev;
    });
    setModalOpen(false);
  };
  const { mutate: create } = api.contentType.create.useMutation({
    onSuccess(created) {
      handleSuccess(created);
    },
  });
  const { mutate: update } = api.contentType.update.useMutation({
    onSuccess(updated) {
      handleSuccess(updated);
    },
  });
  const onSubmit = (input: ContentTypeSchemaType & { serviceId: string }) => {
    if (initialData) update(input);
    else create(input);
  };

  return (
    <Dialog
      onClose={() => setModalOpen(false)}
      open={modalOpen}
      fullWidth
      maxWidth="lg"
    >
      <DialogContent>
        <ContentTypeForm
          service={service}
          initialData={initialData}
          onSubmit={onSubmit}
          //onClose={() => setModalOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default ContentTypeModal;
