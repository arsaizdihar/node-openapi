import { inject, injectable } from 'inversify';
import {
  StoreCreateDTO,
  StoreDTO,
  storeEntityToDTO,
  StoreListParams,
  StoreListResponse,
} from '../domain/store.domain';
import { UserDTO } from '../domain/user.domain';
import { UnauthorizedError } from '../errors/http.errors';
import { StoreNotFoundError } from '../errors/store.errors';
import { StoreRepository } from '../repository/store.repo';
import { Transaction } from '../db';

@injectable()
export class StoreService {
  constructor(
    @inject(StoreRepository)
    private readonly storeRepository: StoreRepository,
  ) {}

  async createStore(
    user: UserDTO,
    dto: StoreCreateDTO,
    tx?: Transaction,
  ): Promise<StoreDTO | null> {
    if (user.role !== 'seller') {
      throw new UnauthorizedError('You are not authorized to create a store');
    }
    const store = await this.storeRepository.createStore(dto, tx);
    return store ? storeEntityToDTO(store) : null;
  }

  async getStoreById(id: string): Promise<StoreDTO | null> {
    const store = await this.storeRepository.getStoreById(id);
    return store ? storeEntityToDTO(store) : null;
  }

  async getStoreByOwnerId(ownerId: string): Promise<StoreDTO | null> {
    const store = await this.storeRepository.getStoreByOwnerId(ownerId);
    return store ? storeEntityToDTO(store) : null;
  }

  async updateStore(
    user: UserDTO,
    id: string,
    dto: Partial<StoreCreateDTO>,
  ): Promise<StoreDTO | null> {
    const store = await this.storeRepository.getStoreByOwnerId(user.id);
    if (!store) {
      throw new StoreNotFoundError();
    }

    if (store.id !== id) {
      throw new UnauthorizedError(
        'You are not authorized to update this store',
      );
    }

    const updatedStore = await this.storeRepository.updateStore(id, dto);

    return updatedStore ? storeEntityToDTO(updatedStore) : null;
  }

  async listStores(params: StoreListParams): Promise<StoreListResponse> {
    const result = await this.storeRepository.listStores(params);

    return {
      ...result,
      stores: result.stores.map(storeEntityToDTO),
    };
  }
}
