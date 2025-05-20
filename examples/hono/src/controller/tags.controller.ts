import { HonoRouteFactory } from '@node-openapi/hono';
import { getTagsRoute } from '../routes/tags.routes';
import { getTags } from 'ws-common/service/tags.service';

export const tagsController = new HonoRouteFactory();

tagsController.route(getTagsRoute, async (c) => {
  const tags = await getTags();
  return c.typedJson({ data: { tags } });
});
