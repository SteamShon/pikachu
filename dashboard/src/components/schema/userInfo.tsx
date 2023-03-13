import { z } from "zod";

export const userInfoSchema = z.object({
  dimension_values: z.array(
    z.object({
      dimension: z.string().min(1),
      values: z.array(z.string().min(1)),
    })
  ),
});
export type UserInfoSchemaType = z.infer<typeof userInfoSchema>;
