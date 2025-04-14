import { inject, injectable } from 'inversify';
import { Database, DB_SYMBOL, schema, Transaction } from '../db';
import {
  StoreCreateDTO,
  StoreEntity,
  StoreListParams,
} from '../domain/store.domain';
import { eq, and, like, sql, SQL } from 'drizzle-orm';

@injectable()
export class StoreRepository {
  constructor(@inject(DB_SYMBOL) private db: Database) {}

  async createStore(
    store: StoreCreateDTO,
    tx?: Transaction,
  ): Promise<StoreEntity | null> {
    const db = tx ?? this.db;
    try {
      return await db.transaction(async (tx) => {
        const result = await tx.insert(schema.stores).values(store).returning();
        return this.getStoreById(result[0].id, tx);
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE')) {
        return null;
      }
      throw error;
    }
  }

  async getStoreById(
    id: string,
    tx?: Transaction,
  ): Promise<StoreEntity | null> {
    const result = await (tx ?? this.db).query.stores.findFirst({
      where: eq(schema.stores.id, id),
      with: {
        owner: true,
      },
    });
    return result ?? null;
  }

  async getStoreByOwnerId(
    ownerId: string,
    tx?: Transaction,
  ): Promise<StoreEntity | null> {
    const result = await (tx ?? this.db).query.stores.findFirst({
      where: eq(schema.stores.ownerId, ownerId),
      with: {
        owner: true,
      },
    });
    return result ?? null;
  }

  async updateStore(
    id: string,
    store: Partial<StoreCreateDTO>,
    tx?: Transaction,
  ): Promise<StoreEntity | null> {
    const db = tx ?? this.db;
    await db.update(schema.stores).set(store).where(eq(schema.stores.id, id));
    return this.getStoreById(id, tx);
  }

  async listStores(
    params: StoreListParams,
    tx?: Transaction,
  ): Promise<{
    stores: StoreEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit, search } = params;
    const offset = (page - 1) * limit;

    const db = tx ?? this.db;

    const whereConditions: SQL[] = [];
    if (search) {
      whereConditions.push(
        like(schema.stores.name, `%${search}%`),
        like(schema.stores.description, `%${search}%`),
      );
    }

    const [stores, total] = await db.transaction(async (tx) => {
      return await Promise.all([
        tx.query.stores.findMany({
          where:
            whereConditions.length > 0 ? and(...whereConditions) : undefined,
          limit,
          offset,
          orderBy: (stores) => stores.createdAt,
          with: {
            owner: true,
          },
        }),
        tx
          .select({ count: sql<number>`count(*)` })
          .from(schema.stores)
          .where(
            whereConditions.length > 0 ? and(...whereConditions) : undefined,
          )
          .then((result) => result[0].count),
      ]);
    });

    return {
      stores,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
