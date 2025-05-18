import { createRoute, z } from '@node-openapi/koa';

export const getTagsRoute = createRoute({
  tags: ['tags'],
  method: 'get',
  path: '/tags',
  summary: 'Get tags',
  description: 'Get tags',
  responses: {
    200: {
      description: 'Tags',
      content: {
        'application/json': { schema: z.object({ tags: z.array(z.string()) }) },
      },
    },
  },
});
