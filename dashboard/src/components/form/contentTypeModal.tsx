import { Dialog, DialogContent } from "@mui/material";
import type { Content, ContentType, Service } from "@prisma/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { Dispatch, SetStateAction } from "react";
import type { serviceRouter } from "../../server/api/routers/service";
import { api } from "../../utils/api";
import type { buildServiceTree } from "../../utils/tree";
import { buildContentTypesTree } from "../../utils/tree";
import type { ContentTypeSchemaType } from "../schema/contentType";
import ContentTypeForm from "./contentTypeForm";

function ContentTypeModal({
  services,
  initialData,
  modalOpen,
  setModalOpen,
  setServiceTree,
}: {
  services: Service[];
  initialData?: ContentType & { contents: Content[] };
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  type RouterOutput = inferRouterOutputs<typeof serviceRouter>;
  type OutputType = RouterOutput["addContentType"];
  const handleSuccess = (created: OutputType): void => {
    setServiceTree((prev) => {
      if (!prev) return prev;

      prev.contentTypes = buildContentTypesTree(created.contentTypes);
      return prev;
    });
    setModalOpen(false);
  };
  const { mutate: create } = api.service.addContentType.useMutation({
    onSuccess(created) {
      handleSuccess(created);
    },
  });
  const { mutate: update } = api.service.updateContentType.useMutation({
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
          services={services}
          initialData={initialData}
          onSubmit={onSubmit}
          //onClose={() => setModalOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default ContentTypeModal;
