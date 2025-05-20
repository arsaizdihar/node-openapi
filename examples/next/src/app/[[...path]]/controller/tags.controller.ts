import { NextRouteFactory } from '@node-openapi/next';
import { getTagsRoute } from '../routes/tags.routes';
import { getTags } from 'ws-common/service/tags.service';

export const tagsController = new NextRouteFactory();

tagsController.route(getTagsRoute, async ({ h }) => {
  const tags = await getTags();

  return h.json({ data: { tags } });
});
