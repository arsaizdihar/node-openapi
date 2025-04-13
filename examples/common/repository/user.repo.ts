import { inject, injectable } from 'inversify';
import { Database, DB_SYMBOL, schema, Transaction } from '../db';
import {
  UserCreateDTO,
  UserEntity,
  UserListParams,
} from '../domain/user.domain';
import { first, firstSure } from '../db/helpers';
import { eq, and, like, sql, SQL } from 'drizzle-orm';
import { userRoles } from '../db/schema';

@injectable()
export class UserRepository {
  constructor(@inject(DB_SYMBOL) private db: Database) {}

  async createUser(user: UserCreateDTO): Promise<UserEntity | null> {
    try {
      const result = await this.db
        .insert(schema.users)
        .values(user)
        .returning();
      return firstSure(result);
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE')) {
        return null;
      }
      throw error;
    }
  }

  async getUserById(id: string, tx?: Transaction): Promise<UserEntity | null> {
    const result = await (tx ?? this.db).query.users.findFirst({
      where: eq(schema.users.id, id),
    });
    return result ?? null;
  }

  async getUserByEmail(
    email: string,
    tx?: Transaction,
  ): Promise<UserEntity | null> {
    const result = await (tx ?? this.db).query.users.findFirst({
      where: eq(schema.users.email, email),
      with: {
        store: true,
        cart: true,
        orders: true,
        reviews: true,
      },
    });
    return result ?? null;
  }

  async updateUser(
    id: string,
    user: Partial<UserCreateDTO>,
    tx?: Transaction,
  ): Promise<UserEntity | null> {
    const result = await (tx ?? this.db)
      .update(schema.users)
      .set(user)
      .where(eq(schema.users.id, id))
      .returning();
    return first(result);
  }

  async deleteUser(id: string, tx?: Transaction): Promise<UserEntity | null> {
    const result = await (tx ?? this.db)
      .delete(schema.users)
      .where(eq(schema.users.id, id))
      .returning();
    return first(result);
  }

  async listUsers(
    params: UserListParams,
    tx?: Transaction,
  ): Promise<{
    users: UserEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit, search, role, isActive } = params;
    const offset = (page - 1) * limit;

    const db = tx ?? this.db;

    const whereConditions: SQL[] = [];
    if (search) {
      whereConditions.push(
        like(schema.users.name, `%${search}%`),
        like(schema.users.email, `%${search}%`),
      );
    }
    if (role) {
      whereConditions.push(
        eq(schema.users.role, role as (typeof userRoles)[number]),
      );
    }
    if (typeof isActive === 'boolean') {
      whereConditions.push(eq(schema.users.isActive, isActive));
    }

    const [users, total] = await db.transaction(async (tx) => {
      return await Promise.all([
        tx.query.users.findMany({
          where:
            whereConditions.length > 0 ? and(...whereConditions) : undefined,
          limit,
          offset,
          orderBy: (users) => users.createdAt,
        }),
        tx
          .select({ count: sql<number>`count(*)` })
          .from(schema.users)
          .where(
            whereConditions.length > 0 ? and(...whereConditions) : undefined,
          )
          .then((result) => result[0].count),
      ]);
    });

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async toggleUserStatus(id: string, tx?: Transaction) {
    return await (tx ?? this.db).transaction(async (tx) => {
      const user = await this.getUserById(id, tx);
      if (!user) {
        throw new Error('User not found');
      }

      const result = await tx
        .update(schema.users)
        .set({
          isActive: !user.isActive,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, id))
        .returning();
      return firstSure(result);
    });
  }
}
