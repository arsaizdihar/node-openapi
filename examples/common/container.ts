import 'reflect-metadata';

import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

import { Container } from 'inversify';
import { db } from './db';
import { DB_SYMBOL } from './db';

export const container = new Container({
  autobind: true,
  defaultScope: 'Singleton',
});

container.bind(DB_SYMBOL).toConstantValue(db);
