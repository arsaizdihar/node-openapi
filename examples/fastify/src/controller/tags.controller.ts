import { OpenAPIRouter } from '@node-openapi/fastify';
import { getTagsRoute } from '../routes/tags.routes';
import { getTags } from 'ws-common/service/tags.service';

export const tagsRouter = new OpenAPIRouter();

tagsRouter.route(getTagsRoute, async ({ h }) => {
  const tags = await getTags();

  h.json({ data: { tags } });
});
