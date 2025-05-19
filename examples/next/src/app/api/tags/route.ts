import { NextRouteFactory, z } from '@node-openapi/next';

import { createRoute } from '@node-openapi/next';
import { NextResponse } from 'next/server';
import { getTags } from 'ws-common/service/tags.service';

export const tagsController = new NextRouteFactory();

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

tagsController.handler(getTagsRoute, async () => {
  const tags = await getTags();
  return NextResponse.json({ tags });
});

export const { GET } = tagsController.handlers;
