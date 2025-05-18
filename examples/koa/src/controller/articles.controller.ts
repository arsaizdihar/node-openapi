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

const checkedAuthFactory = createOptionalAuthFactory();

const authFactory = createRequiredAuthFactory();

authFactory.route(getArticlesFeedRoute, async (ctx) => {
  const result = await getArticlesFeed(ctx.state.user, ctx.state.input.query);

  ctx.state.helper.json({ status: 200, data: result });
});

checkedAuthFactory.route(getArticlesRoute, async (ctx) => {
  const result = await getArticles(
    ctx.state.user ?? undefined,
    ctx.state.input.query,
  );

  ctx.state.helper.json({ status: 200, data: result });
});

authFactory.route(createArticleRoute, async (ctx) => {
  const result = await createArticle(
    ctx.state.user,
    ctx.state.input.json.article,
  );

  ctx.state.helper.json({ status: 201, data: { article: result } });
});

checkedAuthFactory.route(getArticleRoute, async (ctx) => {
  const result = await getArticle(
    ctx.state.input.param.slug,
    ctx.state.user ?? undefined,
  );

  ctx.state.helper.json({ status: 200, data: { article: result } });
});

authFactory.route(updateArticleRoute, async (ctx) => {
  const result = await updateArticle(
    ctx.state.user,
    ctx.state.input.param.slug,
    ctx.state.input.json.article,
  );

  ctx.state.helper.json({ status: 200, data: { article: result } });
});

authFactory.route(deleteArticleRoute, async (ctx) => {
  await deleteArticle(ctx.state.user, ctx.state.input.param.slug);
  ctx.status = 200;
});

authFactory.route(favoriteArticleRoute, async (ctx) => {
  const result = await favoriteArticle(
    ctx.state.user,
    ctx.state.input.param.slug,
  );

  ctx.state.helper.json({ status: 200, data: { article: result } });
});

authFactory.route(unfavoriteArticleRoute, async (ctx) => {
  const result = await unfavoriteArticle(
    ctx.state.user,
    ctx.state.input.param.slug,
  );

  ctx.state.helper.json({ status: 200, data: { article: result } });
});

articlesController.router('', authFactory);
articlesController.router('', checkedAuthFactory);
