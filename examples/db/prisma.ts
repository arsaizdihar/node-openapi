import { PrismaClient } from './generated';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:/Users/arsa/code/kuliah/rest-zod-openapi/examples/db/prisma/dev.db',
    },
  },
});

export default prisma;
