import { Dialog, DialogContent } from "@mui/material";
import type { Content } from "@prisma/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { Dispatch, SetStateAction } from "react";
import type { contentTypeRouter } from "../../server/api/routers/contentType";
import { api } from "../../utils/api";
import type { buildServiceTree } from "../../utils/tree";
import { buildContentTypeTree } from "../../utils/tree";
import type {
  ContentSchemaType,
  ContentWithContentTypeSchemaType,
} from "../schema/content";
import ContentForm from "./contentForm";

function ContentModal({
  contentTypes,
  initialData,
  modalOpen,
  setModalOpen,
  setServiceTree,
}: {
  contentTypes: ReturnType<typeof buildContentTypeTree>[];
  initialData?: Content;
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  type RouterOutput = inferRouterOutputs<typeof contentTypeRouter>;
  type OutputType = RouterOutput["addContent"];
  const handleSuccess = (created: OutputType): void => {
    setServiceTree((prev) => {
      if (!prev) return prev;

      prev.contentTypes[created.id] = buildContentTypeTree(created);
      return prev;
    });

    setModalOpen(false);
  };
  const { mutate: create } = api.contentType.addContent.useMutation({
    onSuccess(created) {
      handleSuccess(created);
    },
  });
  const { mutate: update } = api.contentType.updateContent.useMutation({
    onSuccess(updated) {
      handleSuccess(updated);
    },
  });

  const onSubmit = (input: ContentWithContentTypeSchemaType) => {
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
        <ContentForm
          contentTypes={contentTypes}
          initialData={initialData}
          onSubmit={onSubmit}
          //onClose={() => setModalOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default ContentModal;
