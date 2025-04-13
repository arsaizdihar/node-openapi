import { inject, injectable } from 'inversify';
import { Database, DB_SYMBOL, schema, Transaction } from '../db';
import {
  ProductCreateDTO,
  ProductEntity,
  ProductListParams,
} from '../domain/product.domain';
import { first, firstSure } from '../db/helpers';
import { eq, and, like, sql, SQL, gte, lte } from 'drizzle-orm';

@injectable()
export class ProductRepository {
  constructor(@inject(DB_SYMBOL) private db: Database) {}

  async createProduct(product: ProductCreateDTO): Promise<ProductEntity> {
    const result = await this.db
      .insert(schema.products)
      .values(product)
      .returning();
    return firstSure(result);
  }

  async getProductById(
    id: string,
    tx?: Transaction,
  ): Promise<ProductEntity | null> {
    const result = await (tx ?? this.db).query.products.findFirst({
      where: eq(schema.products.id, id),
      with: {
        store: true,
        category: true,
      },
    });
    return result ?? null;
  }

  async updateProduct(
    id: string,
    product: Partial<ProductCreateDTO>,
    tx?: Transaction,
  ): Promise<ProductEntity | null> {
    const result = await (tx ?? this.db)
      .update(schema.products)
      .set(product)
      .where(eq(schema.products.id, id))
      .returning();
    return first(result);
  }

  async deleteProduct(
    id: string,
    tx?: Transaction,
  ): Promise<ProductEntity | null> {
    const result = await (tx ?? this.db)
      .delete(schema.products)
      .where(eq(schema.products.id, id))
      .returning();
    return first(result);
  }

  async listProducts(
    params: ProductListParams,
    tx?: Transaction,
  ): Promise<{
    products: ProductEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page,
      limit,
      search,
      category,
      minPrice,
      maxPrice,
      storeId,
      isActive,
    } = params;
    const offset = (page - 1) * limit;

    const db = tx ?? this.db;

    const whereConditions: SQL[] = [];
    if (search) {
      whereConditions.push(
        like(schema.products.name, `%${search}%`),
        like(schema.products.description, `%${search}%`),
      );
    }
    if (category) {
      whereConditions.push(eq(schema.products.categoryId, category));
    }
    if (minPrice) {
      whereConditions.push(gte(schema.products.price, minPrice));
    }
    if (maxPrice) {
      whereConditions.push(lte(schema.products.price, maxPrice));
    }
    if (storeId) {
      whereConditions.push(eq(schema.products.storeId, storeId));
    }
    if (typeof isActive === 'boolean') {
      whereConditions.push(eq(schema.products.isActive, isActive));
    }

    const [products, total] = await db.transaction(async (tx) => {
      return await Promise.all([
        tx.query.products.findMany({
          where:
            whereConditions.length > 0 ? and(...whereConditions) : undefined,
          limit,
          offset,
          orderBy: (products) => products.createdAt,
          with: {
            store: true,
            category: true,
          },
        }),
        tx
          .select({ count: sql<number>`count(*)` })
          .from(schema.products)
          .where(
            whereConditions.length > 0 ? and(...whereConditions) : undefined,
          )
          .then((result) => result[0].count),
      ]);
    });

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async toggleProductStatus(id: string, tx?: Transaction) {
    return await (tx ?? this.db).transaction(async (tx) => {
      const product = await this.getProductById(id, tx);
      if (!product) {
        throw new Error('Product not found');
      }

      const result = await tx
        .update(schema.products)
        .set({
          isActive: !product.isActive,
          updatedAt: new Date(),
        })
        .where(eq(schema.products.id, id))
        .returning();
      return firstSure(result);
    });
  }
}
