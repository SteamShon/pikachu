import type { Dispatch, SetStateAction } from "react";
// import { api } from "../../utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import type { Campaign } from "@prisma/client";
import { useSession } from "next-auth/react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { api } from "../../utils/api";
import ErrorSummary from "../common/error";
import { campaignSchema } from "../schema/campaign";

interface CampaignFormProps {
  modalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setCampaigns: Dispatch<SetStateAction<Campaign[]>>;
}

function CampaignForm({
  modalOpen,
  setModalOpen,
  setCampaigns,
}: CampaignFormProps) {
  const { data: session } = useSession();
  const { mutate: addCampaign } = api.campaign.create.useMutation({
    onSuccess(campaign) {
      setCampaigns((prev) => [...prev, campaign]);
      setModalOpen(false);
    },
  });
  const methods = useForm({
    resolver: zodResolver(campaignSchema),
  });
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = methods;
  const onSubmit = (data: any) => {
    console.log(data);
    if (!session?.user) {
      console.log("not logged in.");
      return;
    }
  };

  if (!session) return <>Not Logged in</>;

  return (
    <Dialog onClose={() => setModalOpen(false)} open={modalOpen}>
      <DialogTitle>New Campaign</DialogTitle>
      <DialogContent>
        <FormProvider {...methods}>
          <form>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Name" fullWidth />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Description" fullWidth />
              )}
            />
            <input
              type="hidden"
              {...register("ownerId", { value: session?.user?.id })}
            />
            <input
              type="hidden"
              {...register("creatorId", { value: session?.user?.id })}
            />
            <input
              type="hidden"
              {...register("placementId", { value: session?.user?.id })}
            />
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Type" fullWidth select>
                  <MenuItem key="DISPLAY" value="DISPLAY">
                    DISPLAY
                  </MenuItem>
                  <MenuItem key="MESSAGE" value="MESSAGE">
                    MESSAGE
                  </MenuItem>
                </TextField>
              )}
            />
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Status" fullWidth select>
                  <MenuItem key="CREATED" value="CREATED">
                    CREATED
                  </MenuItem>
                </TextField>
              )}
            />
            <Controller
              name="startedAt"
              control={control}
              render={({ field }) => (
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DatePicker
                    label="StartedAt"
                    renderInput={(params) => <TextField {...params} />}
                    {...field}
                  />
                </LocalizationProvider>
              )}
            />

            <ErrorSummary errors={errors} />
          </form>
        </FormProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setModalOpen(false)}>Close</Button>
        <Button onClick={handleSubmit(onSubmit)}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

export default CampaignForm;
