import { HapiRouteFactory } from '@node-openapi/hapi';
import {
  createRequiredAuthFactory,
  createOptionalAuthFactory,
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

export const articlesController = new HapiRouteFactory();

const optionalAuthFactory = createOptionalAuthFactory();

const requiredAuthFactory = createRequiredAuthFactory();

requiredAuthFactory.route(
  getArticlesFeedRoute,
  async ({ h, input, context }) => {
    const result = await getArticlesFeed(context.user, input.query);

    return h.json({ status: 200, data: result });
  },
);

optionalAuthFactory.route(getArticlesRoute, async ({ h, input, context }) => {
  const result = await getArticles(context.user, input.query);

  return h.json({ status: 200, data: result });
});

requiredAuthFactory.route(createArticleRoute, async ({ h, input, context }) => {
  const result = await createArticle(context.user, input.json.article);

  return h.json({ status: 201, data: { article: result } });
});

optionalAuthFactory.route(getArticleRoute, async ({ h, input, context }) => {
  const result = await getArticle(input.param.slug, context.user);

  return h.json({ status: 200, data: { article: result } });
});

requiredAuthFactory.route(updateArticleRoute, async ({ h, input, context }) => {
  const result = await updateArticle(
    context.user,
    input.param.slug,
    input.json.article,
  );

  return h.json({ status: 200, data: { article: result } });
});

requiredAuthFactory.route(deleteArticleRoute, async ({ h, input, context }) => {
  await deleteArticle(context.user, input.param.slug);
  return h.response().code(200);
});

requiredAuthFactory.route(
  favoriteArticleRoute,
  async ({ h, input, context }) => {
    const result = await favoriteArticle(context.user, input.param.slug);

    return h.json({ status: 200, data: { article: result } });
  },
);

requiredAuthFactory.route(
  unfavoriteArticleRoute,
  async ({ h, input, context }) => {
    const result = await unfavoriteArticle(context.user, input.param.slug);

    return h.json({ status: 200, data: { article: result } });
  },
);

articlesController.router('', requiredAuthFactory);
articlesController.router('', optionalAuthFactory);
