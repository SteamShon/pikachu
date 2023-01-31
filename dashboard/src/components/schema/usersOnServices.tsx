import { z } from "zod";

export const usersOnServicesSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1),
  serviceId: z.string().min(1),
  role: z.enum(["ADMIN", "PUBLISHER", "ADVERTISER"]),
});

export type UsersOnServicesSchemaType = z.infer<typeof usersOnServicesSchema>;
