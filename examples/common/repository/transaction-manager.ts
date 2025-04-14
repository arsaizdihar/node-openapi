import { inject, injectable } from 'inversify';
import { Database, Transaction } from '../db';
import { DB_SYMBOL } from '../db';

@injectable()
export class TransactionManager {
  constructor(@inject(DB_SYMBOL) private db: Database) {}

  async runInTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
    return await this.db.transaction(fn);
  }
}
