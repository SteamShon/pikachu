import { zodResolver } from "@hookform/resolvers/zod";
import type { Service, User } from "@prisma/client";
import { FormProvider, useForm } from "react-hook-form";
import CustomLoadingButton from "../common/CustomLoadingButton";
import type { UsersOnServicesSchemaType } from "../schema/usersOnServices";
import { usersOnServicesSchema } from "../schema/usersOnServices";

function UsersOnServicesForm({
  users,
  services,
  onSubmit,
}: {
  users: User[];
  services: Service[];
  onSubmit: (input: UsersOnServicesSchemaType) => void;
}) {
  const onSubmitFunction = (data: UsersOnServicesSchemaType) => {
    const params = { ...data };

    onSubmit(params);
  };

  const methods = useForm<UsersOnServicesSchemaType>({
    resolver: zodResolver(usersOnServicesSchema),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;

  return (
    <>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmitFunction)} id="placement-form">
          <div className="overflow-hidden bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                UsersOnServices
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Service</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <select
                      {...register("serviceId")}
                      defaultValue={services?.at(0)?.id}
                    >
                      {(services || []).map((service) => {
                        return (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        );
                      })}
                    </select>
                    {errors.serviceId && (
                      <p role="alert">{errors.serviceId?.message}</p>
                    )}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">User</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <select
                      {...register("userId")}
                      defaultValue={users?.at(0)?.id}
                    >
                      {(users || []).map((user) => {
                        return (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        );
                      })}
                    </select>
                    {errors.userId && (
                      <p role="alert">{errors.userId?.message}</p>
                    )}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <select {...register("role")} defaultValue="ADMIN">
                      <option value="ADMIN">ADMIN</option>
                      <option value="PUBLISHER">PUBLISHER</option>
                      <option value="ADVERTISER">ADVERTISER</option>
                    </select>
                    {errors.role && <p role="alert">{errors.role?.message}</p>}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <CustomLoadingButton
              handleSubmit={handleSubmit}
              onSubmit={onSubmit}
            />
          </div>
        </form>
      </FormProvider>
    </>
  );
}

export default UsersOnServicesForm;
