import { OpenAPIRouter } from '@node-openapi/hapi';
import {
  createRequiredAuthRouter,
  createOptionalAuthRouter,
} from '../factories';
import {
  createArticleRoute,
  deleteArticleRoute,
  favoriteArticleRoute,
  getArticleRoute,
  getArticlesFeedRoute,
  getArticlesRoute,
  unfavoriteArticleRoute,
  updateArticleRoute,
} from '../routes/articles.routes';
import {
  createArticle,
  deleteArticle,
  favoriteArticle,
  getArticle,
  getArticles,
  getArticlesFeed,
  unfavoriteArticle,
  updateArticle,
} from 'ws-common/service/articles.service';

export const articlesRouter = new OpenAPIRouter();

const optionalAuthRouter = createOptionalAuthRouter();

const requiredAuthRouter = createRequiredAuthRouter();

requiredAuthRouter.route(
  getArticlesFeedRoute,
  async ({ h, input, context }) => {
    const result = await getArticlesFeed(context.user, input.query);

    return h.json({ status: 200, data: result });
  },
);

optionalAuthRouter.route(getArticlesRoute, async ({ h, input, context }) => {
  const result = await getArticles(context.user, input.query);

  return h.json({ status: 200, data: result });
});

requiredAuthRouter.route(createArticleRoute, async ({ h, input, context }) => {
  const result = await createArticle(context.user, input.json.article);

  return h.json({ status: 201, data: { article: result } });
});

optionalAuthRouter.route(getArticleRoute, async ({ h, input, context }) => {
  const result = await getArticle(input.param.slug, context.user);

  return h.json({ status: 200, data: { article: result } });
});

requiredAuthRouter.route(updateArticleRoute, async ({ h, input, context }) => {
  const result = await updateArticle(
    context.user,
    input.param.slug,
    input.json.article,
  );

  return h.json({ status: 200, data: { article: result } });
});

requiredAuthRouter.route(deleteArticleRoute, async ({ h, input, context }) => {
  await deleteArticle(context.user, input.param.slug);
  return h.response().code(200);
});

requiredAuthRouter.route(
  favoriteArticleRoute,
  async ({ h, input, context }) => {
    const result = await favoriteArticle(context.user, input.param.slug);

    return h.json({ status: 200, data: { article: result } });
  },
);

requiredAuthRouter.route(
  unfavoriteArticleRoute,
  async ({ h, input, context }) => {
    const result = await unfavoriteArticle(context.user, input.param.slug);

    return h.json({ status: 200, data: { article: result } });
  },
);

articlesRouter.use('', requiredAuthRouter);
articlesRouter.use('', optionalAuthRouter);
