import { OpenAPIRouter } from '@node-openapi/fastify';
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

export const articlesRouter = new OpenAPIRouter();

const optionalAuthRouter = createOptionalAuthRouter();

const requiredAuthRouter = createRequiredAuthRouter();

requiredAuthRouter.route(
  getArticlesFeedRoute,
  async ({ context, input, h }) => {
    const result = await getArticlesFeed(context.user, input.query);

    h.json({ data: result });
  },
);

optionalAuthRouter.route(getArticlesRoute, async ({ context, input, h }) => {
  const result = await getArticles(context.user, input.query);

  h.json({ data: result });
});
requiredAuthRouter.route(createArticleRoute, async ({ context, input, h }) => {
  const result = await createArticle(context.user, input.json.article);

  h.json({ data: { article: result }, status: 201 });
});

optionalAuthRouter.route(getArticleRoute, async ({ context, input, h }) => {
  const result = await getArticle(input.param.slug, context.user);

  h.json({ data: { article: result } });
});

requiredAuthRouter.route(updateArticleRoute, async ({ context, input, h }) => {
  const result = await updateArticle(
    context.user,
    input.param.slug,
    input.json.article,
  );

  h.json({ data: { article: result } });
});

requiredAuthRouter.route(deleteArticleRoute, async ({ context, input, h }) => {
  await deleteArticle(context.user, input.param.slug);

  h.json({ data: {} });
});

requiredAuthRouter.route(
  favoriteArticleRoute,
  async ({ context, input, h }) => {
    const result = await favoriteArticle(context.user, input.param.slug);

    h.json({ data: { article: result } });
  },
);

requiredAuthRouter.route(
  unfavoriteArticleRoute,
  async ({ context, input, h }) => {
    const result = await unfavoriteArticle(context.user, input.param.slug);

    h.json({ data: { article: result } });
  },
);

articlesRouter.use('', requiredAuthRouter);
articlesRouter.use('', optionalAuthRouter);
