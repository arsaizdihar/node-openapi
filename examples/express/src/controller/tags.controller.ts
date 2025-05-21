import { OpenAPIRouter } from '@node-openapi/express';
import { getTagsRoute } from '../routes/tags.routes';
import { getTags } from 'ws-common/service/tags.service';

export const tagsRouter = new OpenAPIRouter();

tagsRouter.route(getTagsRoute, async ({ h }, next) => {
  try {
    const tags = await getTags();
    h.json({ data: { tags } });
  } catch (error) {
    next(error);
  }
});
