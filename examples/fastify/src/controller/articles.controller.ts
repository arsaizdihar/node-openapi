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

const checkedAuthFactory = createOptionalAuthFactory();

const authFactory = createRequiredAuthFactory();

authFactory.route(getArticlesFeedRoute, async ({ context, input }) => {
  const result = await getArticlesFeed(context.user, input.query);

  return { status: 200, data: result };
});

checkedAuthFactory.route(getArticlesRoute, async ({ context, input }) => {
  const result = await getArticles(context.user ?? undefined, input.query);

  return { status: 200, data: result };
});

authFactory.route(createArticleRoute, async ({ context, input }) => {
  const result = await createArticle(context.user, input.json.article);

  return { status: 201, data: { article: result } };
});

checkedAuthFactory.route(getArticleRoute, async ({ context, input }) => {
  const result = await getArticle(input.param.slug, context.user ?? undefined);

  return { status: 200 as const, data: { article: result } };
});

authFactory.route(updateArticleRoute, async ({ context, input }) => {
  const result = await updateArticle(
    context.user,
    input.param.slug,
    input.json.article,
  );

  return { status: 200 as const, data: { article: result } };
});

authFactory.route(deleteArticleRoute, async ({ context, input }) => {
  await deleteArticle(context.user, input.param.slug);

  return { status: 200 as const, data: {} };
});

authFactory.route(favoriteArticleRoute, async ({ context, input }) => {
  const result = await favoriteArticle(context.user, input.param.slug);

  return { status: 200 as const, data: { article: result } };
});

authFactory.route(unfavoriteArticleRoute, async ({ context, input }) => {
  const result = await unfavoriteArticle(context.user, input.param.slug);

  return { status: 200 as const, data: { article: result } };
});

articlesController.router('', authFactory);
articlesController.router('', checkedAuthFactory);
