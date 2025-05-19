import { NextRouteFactory, z } from '@node-openapi/next';

import { createRoute } from '@node-openapi/next';

const getTagsRoute = createRoute({
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

export const tagsFactory = new NextRouteFactory().route(getTagsRoute);
