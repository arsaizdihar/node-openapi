import { OpenAPIRouter } from '@node-openapi/koa';
import {
  createRequiredAuthRouter,
  createOptionalAuthRouter,
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

export const articlesRouter = new OpenAPIRouter();

const optionalAuthRouter = createOptionalAuthRouter();

const requiredAuthRouter = createRequiredAuthRouter();

requiredAuthRouter.route(getArticlesFeedRoute, async ({ input, state, h }) => {
  const result = await getArticlesFeed(state.user, input.query);

  h.json({ data: result });
});

optionalAuthRouter.route(getArticlesRoute, async ({ input, state, h }) => {
  const result = await getArticles(state.user, input.query);

  h.json({ data: result });
});

requiredAuthRouter.route(createArticleRoute, async ({ input, state, h }) => {
  const result = await createArticle(state.user, input.json.article);

  h.json({ status: 201, data: { article: result } });
});

optionalAuthRouter.route(getArticleRoute, async ({ input, state, h }) => {
  const result = await getArticle(input.param.slug, state.user);

  h.json({ data: { article: result } });
});

requiredAuthRouter.route(updateArticleRoute, async ({ input, state, h }) => {
  const result = await updateArticle(
    state.user,
    input.param.slug,
    input.json.article,
  );

  h.json({ data: { article: result } });
});

requiredAuthRouter.route(deleteArticleRoute, async ({ input, state, h }) => {
  await deleteArticle(state.user, input.param.slug);
  h.json({ data: null });
});

requiredAuthRouter.route(favoriteArticleRoute, async ({ input, state, h }) => {
  const result = await favoriteArticle(state.user, input.param.slug);

  h.json({ data: { article: result } });
});

requiredAuthRouter.route(
  unfavoriteArticleRoute,
  async ({ input, state, h }) => {
    const result = await unfavoriteArticle(state.user, input.param.slug);

    h.json({ data: { article: result } });
  },
);

articlesRouter.use('', requiredAuthRouter);
articlesRouter.use('', optionalAuthRouter);
