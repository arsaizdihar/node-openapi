import { KoaRouteFactory } from '@node-openapi/koa';
import { getTagsRoute } from '../routes/tags.routes';
import { getTags } from 'ws-common/service/tags.service';

export const tagsController = new KoaRouteFactory();

tagsController.route(getTagsRoute, async (ctx) => {
  const tags = await getTags();
  ctx.state.helper.json({ status: 200, data: { tags } });
});
