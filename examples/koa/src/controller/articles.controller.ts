import { KoaRouteFactory } from '@node-openapi/koa';
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

export const articlesController = new KoaRouteFactory();

const optionalAuthFactory = createOptionalAuthFactory();

const requiredAuthFactory = createRequiredAuthFactory();

requiredAuthFactory.route(getArticlesFeedRoute, async (ctx) => {
  const result = await getArticlesFeed(ctx.state.user, ctx.state.input.query);

  ctx.state.helper.json({ status: 200, data: result });
});

optionalAuthFactory.route(getArticlesRoute, async (ctx) => {
  const result = await getArticles(
    ctx.state.user ?? undefined,
    ctx.state.input.query,
  );

  ctx.state.helper.json({ status: 200, data: result });
});

requiredAuthFactory.route(createArticleRoute, async (ctx) => {
  const result = await createArticle(
    ctx.state.user,
    ctx.state.input.json.article,
  );

  ctx.state.helper.json({ status: 201, data: { article: result } });
});

optionalAuthFactory.route(getArticleRoute, async (ctx) => {
  const result = await getArticle(
    ctx.state.input.param.slug,
    ctx.state.user ?? undefined,
  );

  ctx.state.helper.json({ status: 200, data: { article: result } });
});

requiredAuthFactory.route(updateArticleRoute, async (ctx) => {
  const result = await updateArticle(
    ctx.state.user,
    ctx.state.input.param.slug,
    ctx.state.input.json.article,
  );

  ctx.state.helper.json({ status: 200, data: { article: result } });
});

requiredAuthFactory.route(deleteArticleRoute, async (ctx) => {
  await deleteArticle(ctx.state.user, ctx.state.input.param.slug);
  ctx.status = 200;
});

requiredAuthFactory.route(favoriteArticleRoute, async (ctx) => {
  const result = await favoriteArticle(
    ctx.state.user,
    ctx.state.input.param.slug,
  );

  ctx.state.helper.json({ status: 200, data: { article: result } });
});

requiredAuthFactory.route(unfavoriteArticleRoute, async (ctx) => {
  const result = await unfavoriteArticle(
    ctx.state.user,
    ctx.state.input.param.slug,
  );

  ctx.state.helper.json({ status: 200, data: { article: result } });
});

articlesController.router('', requiredAuthFactory);
articlesController.router('', optionalAuthFactory);
