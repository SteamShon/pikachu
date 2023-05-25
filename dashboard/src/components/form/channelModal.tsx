import { Dialog, DialogContent } from "@mui/material";
import type { Dispatch, SetStateAction } from "react";
import { buildChannelTree, buildServiceTree } from "../../utils/tree";
import type { ChannelSchemaType } from "../schema/channel";
import ChannelForm from "./channelForm";
import { inferRouterOutputs } from "@trpc/server";
import { serviceRouter } from "../../server/api/routers/service";
import { api } from "../../utils/api";

function ChannelModal({
  service,
  initialData,
  modalOpen,
  setModalOpen,
  setServiceTree,
}: {
  service: Parameters<typeof ChannelForm>[0]["service"];
  initialData?: Parameters<typeof ChannelForm>[0]["initialData"];
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setServiceTree: Dispatch<
    SetStateAction<ReturnType<typeof buildServiceTree> | undefined>
  >;
}) {
  type RouterOutput = inferRouterOutputs<typeof serviceRouter>;
  type OutputType = RouterOutput["addChannel"];

  const handleSuccess = (created: OutputType): void => {
    setServiceTree((prev) => {
      if (!prev) return undefined;
      prev.channels = buildChannelTree(created.channels);
      return prev;
    });

    setModalOpen(false);
  };
  const { mutate: create } = api.service.addChannel.useMutation({
    onSuccess(created) {
      handleSuccess(created);
    },
  });

  const { mutate: update } = api.service.updateChannel.useMutation({
    onSuccess(updated) {
      handleSuccess(updated);
    },
  });

  const onSubmit = (input: ChannelSchemaType) => {
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
        <ChannelForm
          service={service}
          initialData={initialData}
          onSubmit={onSubmit}
          //onClose={() => setModalOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default ChannelModal;
