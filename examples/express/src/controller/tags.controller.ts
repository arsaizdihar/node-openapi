import { ExpressRouteFactory } from '@node-openapi/express';
import { getTagsRoute } from '../routes/tags.routes';
import { getTags } from 'ws-common/service/tags.service';

export const tagsController = new ExpressRouteFactory();

tagsController.route(getTagsRoute, async (_, res, next) => {
  try {
    const tags = await getTags();
    res.json({ tags });
  } catch (error) {
    next(error);
  }
});
