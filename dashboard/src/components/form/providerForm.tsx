import { zodResolver } from "@hookform/resolvers/zod";
// import type { Provider, Service, ServiceConfig } from "@prisma/client";
// import { useEffect, useState } from "react";
// import { FormProvider, useForm } from "react-hook-form";
// import type { ProviderSchemaType } from "../schema/provider";
// import { providerSchema } from "../schema/provider";
// import Solapi from "./providers/solapi";
// import CustomLoadingButton from "../common/CustomLoadingButton";
// import PikachuAPI from "./providers/pikachuApi";
// import AWSS3ConfigForm from "./service/awsS3ConfigForm";
// import PostgresUserFeature from "./providers/postgresUserFeature";
// import AWSS3DuckDB from "./providers/awsS3DuckDB";

// function ProviderForm({
//   service,
//   initialData,
//   provide,
//   name,
//   onSubmit,
// }: {
//   service: Service & { serviceConfig?: ServiceConfig | null };
//   initialData?: Provider;
//   provide?: string;
//   name?: string;
//   onSubmit: (input: ProviderSchemaType) => void;
// }) {
//   const methods = useForm<ProviderSchemaType>({
//     resolver: zodResolver(providerSchema),
//   });

//   const {
//     register,
//     handleSubmit,
//     reset,
//     watch,
//     formState: { errors },
//   } = methods;

//   useEffect(() => {
//     const details = initialData?.details as {
//       // eslint-disable-next-line @typescript-eslint/ban-types
//       [x: string]: {};
//     };
//     if (initialData) {
//       reset({
//         ...initialData,
//         details,
//       });
//     }
//   }, [initialData, reset]);

//   const renderDetails = () => {
//     if (provide === "SMS" && name === "SOLAPI") {
//       return <Solapi />;
//     } else if (provide === "API" && name === "PIKACHU_API") {
//       return <PikachuAPI />;
//     } else if (provide === "CUBE" && name === "AWS_S3_DUCKDB") {
//       return <AWSS3DuckDB />;
//     } else if (provide === "USER_FEATURE" && name === "POSTGRES") {
//       return <PostgresUserFeature />;
//     } else {
//       return <></>;
//     }
//   };
//   return (
//     <>
//       <FormProvider {...methods}>
//         <form onSubmit={handleSubmit(onSubmit)} id="channel-form">
//           <input type="hidden" {...register("serviceId")} value={service.id} />
//           <input type="hidden" {...register("provide")} value={provide} />
//           <input type="hidden" {...register("name")} value={name} />

//           <div className="overflow-hidden bg-white shadow sm:rounded-lg">
//             <div className="px-4 py-5 sm:px-6">
//               <h3 className="text-lg font-medium leading-6 text-gray-900">
//                 {name} Provider
//               </h3>
//             </div>
//             <div className="border-t border-gray-200">
//               <dl>
//                 <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
//                   <dt className="text-sm font-medium text-gray-500">
//                     Description
//                   </dt>
//                   <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
//                     <textarea
//                       className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
//                       defaultValue={initialData?.description || undefined}
//                       rows={3}
//                       {...register("description")}
//                     />
//                     {errors.description && (
//                       <p role="alert">{errors.description?.message}</p>
//                     )}
//                   </dd>
//                 </div>
//                 <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
//                   <dt className="text-sm font-medium text-gray-500">Status</dt>
//                   <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
//                     <select
//                       {...register("status")}
//                       defaultValue={initialData?.status}
//                     >
//                       <option value="CREATED">CREATED</option>
//                       <option value="PUBLISHED">PUBLISHED</option>
//                       <option value="ARCHIVED">ARCHIVED</option>
//                     </select>
//                     {errors.status && (
//                       <p role="alert">{errors.status?.message}</p>
//                     )}
//                   </dd>
//                 </div>
//                 <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
//                   <dt className="text-sm font-medium text-gray-500">Details</dt>
//                   <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
//                     {renderDetails()}
//                   </dd>
//                 </div>
//               </dl>
//             </div>
//           </div>

//           <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
//             <CustomLoadingButton
//               handleSubmit={handleSubmit}
//               onSubmit={onSubmit}
//             />
//           </div>
//         </form>
//       </FormProvider>
//     </>
//   );
// }

// export default ProviderForm;
