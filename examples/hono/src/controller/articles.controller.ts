import { OpenAPIRouter } from '@node-openapi/hono';
import {
  createOptionalAuthRouter,
  createRequiredAuthRouter,
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

export const articlesRouter = new OpenAPIRouter();

const optionalAuthRouter = createOptionalAuthRouter();

const requiredAuthRouter = createRequiredAuthRouter();

requiredAuthRouter.route(getArticlesFeedRoute, async (c) => {
  const result = await getArticlesFeed(c.var.user, c.req.valid('query'));

  return c.typedJson({ data: result });
});

optionalAuthRouter.route(getArticlesRoute, async (c) => {
  const result = await getArticles(c.var.user, c.req.valid('query'));
  return c.typedJson({ data: result });
});

requiredAuthRouter.route(createArticleRoute, async (c) => {
  const result = await createArticle(c.var.user, c.req.valid('json').article);
  return c.typedJson({ data: { article: result }, status: 201 });
});

optionalAuthRouter.route(getArticleRoute, async (c) => {
  const result = await getArticle(c.req.valid('param').slug, c.var.user);
  return c.typedJson({ data: { article: result } });
});

requiredAuthRouter.route(updateArticleRoute, async (c) => {
  const result = await updateArticle(
    c.var.user,
    c.req.valid('param').slug,
    c.req.valid('json').article,
  );
  return c.typedJson({ data: { article: result } });
});

requiredAuthRouter.route(deleteArticleRoute, async (c) => {
  await deleteArticle(c.var.user, c.req.valid('param').slug);
  return c.body(null);
});

requiredAuthRouter.route(favoriteArticleRoute, async (c) => {
  const result = await favoriteArticle(c.var.user, c.req.valid('param').slug);
  return c.typedJson({ data: { article: result } });
});

requiredAuthRouter.route(unfavoriteArticleRoute, async (c) => {
  const result = await unfavoriteArticle(c.var.user, c.req.valid('param').slug);
  return c.json({ article: result });
});

articlesRouter.use('', requiredAuthRouter);
articlesRouter.use('', optionalAuthRouter);
