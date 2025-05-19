import { FastifyRouteFactory } from '@node-openapi/fastify';
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
  createOptionalAuthFactory,
  createRequiredAuthFactory,
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

export const articlesController = new FastifyRouteFactory();

const optionalAuthFactory = createOptionalAuthFactory();

const requiredAuthFactory = createRequiredAuthFactory();

requiredAuthFactory.route(getArticlesFeedRoute, async ({ context, input }) => {
  const result = await getArticlesFeed(context.user, input.query);

  return { status: 200, data: result };
});

optionalAuthFactory.route(getArticlesRoute, async ({ context, input }) => {
  const result = await getArticles(context.user ?? undefined, input.query);

  return { status: 200, data: result };
});

requiredAuthFactory.route(createArticleRoute, async ({ context, input }) => {
  const result = await createArticle(context.user, input.json.article);

  return { status: 201, data: { article: result } };
});

optionalAuthFactory.route(getArticleRoute, async ({ context, input }) => {
  const result = await getArticle(input.param.slug, context.user ?? undefined);

  return { status: 200 as const, data: { article: result } };
});

requiredAuthFactory.route(updateArticleRoute, async ({ context, input }) => {
  const result = await updateArticle(
    context.user,
    input.param.slug,
    input.json.article,
  );

  return { status: 200 as const, data: { article: result } };
});

requiredAuthFactory.route(deleteArticleRoute, async ({ context, input }) => {
  await deleteArticle(context.user, input.param.slug);

  return { status: 200 as const, data: {} };
});

requiredAuthFactory.route(favoriteArticleRoute, async ({ context, input }) => {
  const result = await favoriteArticle(context.user, input.param.slug);

  return { status: 200 as const, data: { article: result } };
});

requiredAuthFactory.route(
  unfavoriteArticleRoute,
  async ({ context, input }) => {
    const result = await unfavoriteArticle(context.user, input.param.slug);

    return { status: 200 as const, data: { article: result } };
  },
);

articlesController.router('', requiredAuthFactory);
articlesController.router('', optionalAuthFactory);
