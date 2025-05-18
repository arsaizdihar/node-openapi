import { HapiRouteFactory } from '@node-openapi/hapi';
import { getTagsRoute } from '../routes/tags.routes';
import { getTags } from 'ws-common/service/tags.service';

export const tagsController = new HapiRouteFactory();

tagsController.route(getTagsRoute, async (_req, _h, { helper }) => {
  const tags = await getTags();
  return helper.json({ status: 200, data: { tags } });
});
