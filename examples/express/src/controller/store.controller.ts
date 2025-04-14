import { inject, injectable } from 'inversify';
import { BaseController } from './base.controller';
import { StoreService } from 'ws-common/service/store.service';
import { Factories } from '../factories';
import {
  getStoreRoute,
  getStoresRoute,
  updateStoreRoute,
} from '../routes/store.routes';
import { StoreNotFoundError } from 'ws-common/errors/store.errors';

@injectable()
export class StoreController extends BaseController {
  constructor(
    @inject(StoreService) private storeService: StoreService,
    @inject(Factories) private factories: Factories,
  ) {
    super();

    const authFactory = this.factories.createAuthFactory();
    const sellerMiddleware = this.factories.roleMiddleware('seller');

    this.factory.route(getStoresRoute, async (_, res, next) => {
      try {
        const stores = await this.storeService.listStores(res.locals.query);
        res.json(stores);
      } catch (error) {
        next(error);
      }
    });

    this.factory.route(getStoreRoute, async (req, res, next) => {
      try {
        const store = await this.storeService.getStoreById(req.params.id);

        if (!store) {
          next(new StoreNotFoundError());
          return;
        }

        res.json(store);
      } catch (error) {
        next(error);
      }
    });

    authFactory.route(
      updateStoreRoute,
      sellerMiddleware,
      async (req, res, next) => {
        try {
          const store = await this.storeService.updateStore(
            res.locals.user,
            req.params.id,
            req.body,
          );

          if (!store) {
            next(new StoreNotFoundError());
            return;
          }
          res.json(store);
        } catch (error) {
          next(error);
        }
      },
    );

    this.factory.router('/', authFactory);
  }
}
