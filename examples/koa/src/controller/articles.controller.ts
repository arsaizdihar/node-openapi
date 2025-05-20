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

requiredAuthFactory.route(getArticlesFeedRoute, async ({ input, state, h }) => {
  const result = await getArticlesFeed(state.user, input.query);

  h.json({ data: result });
});

optionalAuthFactory.route(getArticlesRoute, async ({ input, state, h }) => {
  const result = await getArticles(state.user, input.query);

  h.json({ data: result });
});

requiredAuthFactory.route(createArticleRoute, async ({ input, state, h }) => {
  const result = await createArticle(state.user, input.json.article);

  h.json({ status: 201, data: { article: result } });
});

optionalAuthFactory.route(getArticleRoute, async ({ input, state, h }) => {
  const result = await getArticle(input.param.slug, state.user);

  h.json({ data: { article: result } });
});

requiredAuthFactory.route(updateArticleRoute, async ({ input, state, h }) => {
  const result = await updateArticle(
    state.user,
    input.param.slug,
    input.json.article,
  );

  h.json({ data: { article: result } });
});

requiredAuthFactory.route(deleteArticleRoute, async ({ input, state, h }) => {
  await deleteArticle(state.user, input.param.slug);
  h.json({ data: null });
});

requiredAuthFactory.route(favoriteArticleRoute, async ({ input, state, h }) => {
  const result = await favoriteArticle(state.user, input.param.slug);

  h.json({ data: { article: result } });
});

requiredAuthFactory.route(
  unfavoriteArticleRoute,
  async ({ input, state, h }) => {
    const result = await unfavoriteArticle(state.user, input.param.slug);

    h.json({ data: { article: result } });
  },
);

articlesController.router('', requiredAuthFactory);
articlesController.router('', optionalAuthFactory);
