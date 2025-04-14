import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { schema } from '../db';
import { UserEntity, userEntityToDTO, userSchema } from './user.domain';

export const storeCreateSchema = createInsertSchema(schema.stores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type StoreCreateDTO = z.infer<typeof storeCreateSchema>;

export const storeSchema = createSelectSchema(schema.stores)
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    owner: userSchema,
  })
  .openapi('Store');

export type StoreDTO = z.infer<typeof storeSchema>;

export type StoreEntity = typeof schema.stores.$inferSelect & {
  owner: UserEntity;
};

export const storeListParamsSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(50).optional().default(10),
  search: z
    .string()
    .optional()
    .openapi({ description: 'Search by name or description' }),
});

export type StoreListParams = z.infer<typeof storeListParamsSchema>;

export const storeListResponseSchema = z.object({
  stores: z.array(storeSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export type StoreListResponse = z.infer<typeof storeListResponseSchema>;

export function storeEntityToDTO(store: StoreEntity): StoreDTO {
  return {
    ...store,
    createdAt: store.createdAt.toISOString(),
    updatedAt: store.updatedAt.toISOString(),
    owner: userEntityToDTO(store.owner),
  };
}
