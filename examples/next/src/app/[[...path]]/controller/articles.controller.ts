import { NextRouteFactory } from '@node-openapi/next';
import {
  createOptionalAuthFactory,
  createRequiredAuthFactory,
} from '../factories';
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

export const articlesController = new NextRouteFactory();

const optionalAuthFactory = createOptionalAuthFactory();

const requiredAuthFactory = createRequiredAuthFactory();

requiredAuthFactory.route(
  getArticlesFeedRoute,
  async ({ input, context, h }) => {
    const result = await getArticlesFeed(context.user, input.query);

    return h.json({ data: result });
  },
);

optionalAuthFactory.route(getArticlesRoute, async ({ input, context, h }) => {
  const result = await getArticles(context.user, input.query);

  return h.json({ data: result });
});

requiredAuthFactory.route(createArticleRoute, async ({ input, context, h }) => {
  const result = await createArticle(context.user, input.json.article);

  return h.json({ data: { article: result }, status: 201 });
});

optionalAuthFactory.route(getArticleRoute, async ({ input, context, h }) => {
  const result = await getArticle(input.param.slug, context.user);

  return h.json({ data: { article: result } });
});

requiredAuthFactory.route(updateArticleRoute, async ({ input, context, h }) => {
  const result = await updateArticle(
    context.user,
    input.param.slug,
    input.json.article,
  );

  return h.json({ data: { article: result } });
});

requiredAuthFactory.route(deleteArticleRoute, async ({ input, context, h }) => {
  await deleteArticle(context.user, input.param.slug);

  return h.json({ data: null });
});

requiredAuthFactory.route(
  favoriteArticleRoute,
  async ({ input, context, h }) => {
    const result = await favoriteArticle(context.user, input.param.slug);

    return h.json({ data: { article: result } });
  },
);

requiredAuthFactory.route(
  unfavoriteArticleRoute,
  async ({ input, context, h }) => {
    const result = await unfavoriteArticle(context.user, input.param.slug);

    return h.json({ data: { article: result } });
  },
);

articlesController.router('', requiredAuthFactory);
articlesController.router('', optionalAuthFactory);
