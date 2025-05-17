import { FastifyRouteFactory } from '@node-openapi/fastify';
import { getTagsRoute } from '../routes/tags.routes';
import { getTags } from 'ws-common/service/tags.service';

export const tagsController = new FastifyRouteFactory();

tagsController.route(getTagsRoute, async () => {
  const tags = await getTags();

  return { status: 200 as const, data: { tags } };
});
