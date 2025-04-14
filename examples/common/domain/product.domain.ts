import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { schema } from '../db';
import { StoreEntity, storeEntityToDTO, storeSchema } from './store.domain';

export const productCreateSchema = createInsertSchema(schema.products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ProductCreateDTO = z.infer<typeof productCreateSchema>;

export const productSchema = createSelectSchema(schema.products)
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    store: storeSchema,
  })
  .openapi('Product');

export type ProductDTO = z.infer<typeof productSchema>;

export type ProductEntity = typeof schema.products.$inferSelect & {
  store: StoreEntity;
};

export const productListParamsSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(50).optional().default(10),
  search: z
    .string()
    .optional()
    .openapi({ description: 'Search by name or description' }),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  storeId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type ProductListParams = z.infer<typeof productListParamsSchema>;

export const productListResponseSchema = z.object({
  products: z.array(productSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export type ProductListResponse = z.infer<typeof productListResponseSchema>;

export function productEntityToDTO(product: ProductEntity): ProductDTO {
  return {
    ...product,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    store: storeEntityToDTO(product.store),
  };
}
