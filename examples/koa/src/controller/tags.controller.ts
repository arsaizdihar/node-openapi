import { KoaRouteFactory } from '@node-openapi/koa';
import { getTagsRoute } from '../routes/tags.routes';
import { getTags } from 'ws-common/service/tags.service';

export const tagsController = new KoaRouteFactory();

tagsController.route(getTagsRoute, async ({ h }) => {
  const tags = await getTags();
  h.json({ data: { tags } });
});
