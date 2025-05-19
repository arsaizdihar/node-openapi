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
  const result = await getArticlesFeed(c.get('user'), c.req.valid('query'));
  return c.json(result);
});

optionalAuthFactory.route(getArticlesRoute, async (c) => {
  const result = await getArticles(
    c.get('user') ?? undefined,
    c.req.valid('query'),
  );
  return c.json(result);
});

requiredAuthFactory.route(createArticleRoute, async (c) => {
  const result = await createArticle(
    c.get('user'),
    c.req.valid('json').article,
  );
  return c.json({ article: result }, 201);
});

optionalAuthFactory.route(getArticleRoute, async (c) => {
  const result = await getArticle(
    c.req.valid('param').slug,
    c.get('user') ?? undefined,
  );
  return c.json({ article: result });
});

requiredAuthFactory.route(updateArticleRoute, async (c) => {
  const result = await updateArticle(
    c.get('user'),
    c.req.valid('param').slug,
    c.req.valid('json').article,
  );
  return c.json({ article: result });
});

requiredAuthFactory.route(deleteArticleRoute, async (c) => {
  await deleteArticle(c.get('user'), c.req.valid('param').slug);
  return c.body(null, 204);
});

requiredAuthFactory.route(favoriteArticleRoute, async (c) => {
  const result = await favoriteArticle(
    c.get('user'),
    c.req.valid('param').slug,
  );
  return c.json({ article: result });
});

requiredAuthFactory.route(unfavoriteArticleRoute, async (c) => {
  const result = await unfavoriteArticle(
    c.get('user'),
    c.req.valid('param').slug,
  );
  return c.json({ article: result });
});

articlesController.router('', requiredAuthFactory);
articlesController.router('', optionalAuthFactory);
