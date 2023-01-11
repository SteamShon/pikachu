import type { Customset, CustomsetInfo, User } from "@prisma/client";
import { useRouter } from "next/router";
import CustomsetForm from "../../../components/form/customsetForm";
import { api } from "../../../utils/api";

function CustomsetEdit() {
  const router = useRouter();
  const { id } = router.query;
  const { data: customset } = api.customset.get.useQuery({ id: id as string });

  const { mutate: updateCustomset } = api.customset.update.useMutation({
    onSuccess(customset) {
      router.push("/customset/list");
    },
  });

  return (
    <>
      <CustomsetForm
        onSubmit={updateCustomset}
        initialData={customset || undefined}
      />
    </>
  );
}

export default CustomsetEdit;
