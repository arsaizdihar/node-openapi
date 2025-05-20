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

const optionalAuthFactory = createOptionalAuthFactory();

const requiredAuthFactory = createRequiredAuthFactory();

requiredAuthFactory.route(
  getArticlesFeedRoute,
  async ({ context, input, h }) => {
    const result = await getArticlesFeed(context.user, input.query);

    h.json({ data: result });
  },
);

optionalAuthFactory.route(getArticlesRoute, async ({ context, input, h }) => {
  const result = await getArticles(context.user, input.query);

  h.json({ data: result });
});
requiredAuthFactory.route(createArticleRoute, async ({ context, input, h }) => {
  const result = await createArticle(context.user, input.json.article);

  h.json({ data: { article: result }, status: 201 });
});

optionalAuthFactory.route(getArticleRoute, async ({ context, input, h }) => {
  const result = await getArticle(input.param.slug, context.user);

  h.json({ data: { article: result } });
});

requiredAuthFactory.route(updateArticleRoute, async ({ context, input, h }) => {
  const result = await updateArticle(
    context.user,
    input.param.slug,
    input.json.article,
  );

  h.json({ data: { article: result } });
});

requiredAuthFactory.route(deleteArticleRoute, async ({ context, input, h }) => {
  await deleteArticle(context.user, input.param.slug);

  h.json({ data: {} });
});

requiredAuthFactory.route(
  favoriteArticleRoute,
  async ({ context, input, h }) => {
    const result = await favoriteArticle(context.user, input.param.slug);

    h.json({ data: { article: result } });
  },
);

requiredAuthFactory.route(
  unfavoriteArticleRoute,
  async ({ context, input, h }) => {
    const result = await unfavoriteArticle(context.user, input.param.slug);

    h.json({ data: { article: result } });
  },
);

articlesController.router('', requiredAuthFactory);
articlesController.router('', optionalAuthFactory);
