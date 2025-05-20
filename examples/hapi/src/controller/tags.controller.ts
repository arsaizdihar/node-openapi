import { HapiRouteFactory } from '@node-openapi/hapi';
import { getTagsRoute } from '../routes/tags.routes';
import { getTags } from 'ws-common/service/tags.service';

export const tagsController = new HapiRouteFactory();

tagsController.route(getTagsRoute, async ({ h }) => {
  const tags = await getTags();
  return h.json({ data: { tags } });
});
