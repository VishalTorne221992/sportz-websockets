import { z } from "zod";

// query schema for listing commentary entries
export const listCommentaryQuerySchema = z.object({
  limit: z
    .coerce
    .number()
    .int()
    .positive()
    .max(100)
    .optional(),
});

// schema for creating a commentary record
export const createCommentarySchema = z.object({
  minute: z.coerce.number().int().nonnegative(),
  sequence: z.coerce.number().int().nonnegative(),
  period: z.string().min(1),
  eventType: z.string().min(1),
  actor: z.string().min(1),
  team: z.string().min(1),
  message: z.string().min(1),
  metadata: z.record(z.string(), z.any()).optional().default({}),
  tags: z.array(z.string()).optional().default([]),
});
