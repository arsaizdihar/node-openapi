import 'reflect-metadata';

import { Container } from 'inversify';
import { db } from './db';
import { DB_SYMBOL } from './db';

export const container = new Container({
  autobind: true,
  defaultScope: 'Singleton',
});

container.bind(DB_SYMBOL).toConstantValue(db);
