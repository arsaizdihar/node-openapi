import { HonoRouteFactory } from '@node-openapi/hono';
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
import {
  getArticles,
  getArticlesFeed,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  favoriteArticle,
  unfavoriteArticle,
} from 'ws-common/service/articles.service';

export const articlesController = new HonoRouteFactory();

const optionalAuthFactory = createOptionalAuthFactory();

const requiredAuthFactory = createRequiredAuthFactory();

requiredAuthFactory.route(getArticlesFeedRoute, async (c) => {
  const result = await getArticlesFeed(c.var.user, c.req.valid('query'));

  return c.typedJson({ data: result });
});

optionalAuthFactory.route(getArticlesRoute, async (c) => {
  const result = await getArticles(c.var.user, c.req.valid('query'));
  return c.typedJson({ data: result });
});

requiredAuthFactory.route(createArticleRoute, async (c) => {
  const result = await createArticle(c.var.user, c.req.valid('json').article);
  return c.typedJson({ data: { article: result }, status: 201 });
});

optionalAuthFactory.route(getArticleRoute, async (c) => {
  const result = await getArticle(c.req.valid('param').slug, c.var.user);
  return c.typedJson({ data: { article: result } });
});

requiredAuthFactory.route(updateArticleRoute, async (c) => {
  const result = await updateArticle(
    c.var.user,
    c.req.valid('param').slug,
    c.req.valid('json').article,
  );
  return c.typedJson({ data: { article: result } });
});

requiredAuthFactory.route(deleteArticleRoute, async (c) => {
  await deleteArticle(c.var.user, c.req.valid('param').slug);
  return c.body(null);
});

requiredAuthFactory.route(favoriteArticleRoute, async (c) => {
  const result = await favoriteArticle(c.var.user, c.req.valid('param').slug);
  return c.typedJson({ data: { article: result } });
});

requiredAuthFactory.route(unfavoriteArticleRoute, async (c) => {
  const result = await unfavoriteArticle(c.var.user, c.req.valid('param').slug);
  return c.json({ article: result });
});

articlesController.router('', requiredAuthFactory);
articlesController.router('', optionalAuthFactory);
