import { OpenAPIRouter } from '@node-openapi/next';
import {
  createOptionalAuthRouter,
  createRequiredAuthRouter,
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

export const articlesRouter = new OpenAPIRouter();

const optionalAuthRouter = createOptionalAuthRouter();

const requiredAuthRouter = createRequiredAuthRouter();

requiredAuthRouter.route(
  getArticlesFeedRoute,
  async ({ input, context, h }) => {
    const result = await getArticlesFeed(context.user, input.query);

    return h.json({ data: result });
  },
);

optionalAuthRouter.route(getArticlesRoute, async ({ input, context, h }) => {
  const result = await getArticles(context.user, input.query);

  return h.json({ data: result });
});

requiredAuthRouter.route(createArticleRoute, async ({ input, context, h }) => {
  const result = await createArticle(context.user, input.json.article);

  return h.json({ data: { article: result }, status: 201 });
});

optionalAuthRouter.route(getArticleRoute, async ({ input, context, h }) => {
  const result = await getArticle(input.param.slug, context.user);

  return h.json({ data: { article: result } });
});

requiredAuthRouter.route(updateArticleRoute, async ({ input, context, h }) => {
  const result = await updateArticle(
    context.user,
    input.param.slug,
    input.json.article,
  );

  return h.json({ data: { article: result } });
});

requiredAuthRouter.route(deleteArticleRoute, async ({ input, context, h }) => {
  await deleteArticle(context.user, input.param.slug);

  return h.json({ data: null });
});

requiredAuthRouter.route(
  favoriteArticleRoute,
  async ({ input, context, h }) => {
    const result = await favoriteArticle(context.user, input.param.slug);

    return h.json({ data: { article: result } });
  },
);

requiredAuthRouter.route(
  unfavoriteArticleRoute,
  async ({ input, context, h }) => {
    const result = await unfavoriteArticle(context.user, input.param.slug);

    return h.json({ data: { article: result } });
  },
);

articlesRouter.use('', requiredAuthRouter);
articlesRouter.use('', optionalAuthRouter);
