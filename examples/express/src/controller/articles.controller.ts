import { OpenAPIRouter } from '@node-openapi/express';
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

requiredAuthRouter.route(
  getArticlesFeedRoute,
  async ({ input, context, h }, next) => {
    try {
      const result = await getArticlesFeed(context.user, input.query);

      h.json({ data: result });
    } catch (error) {
      next(error);
    }
  },
);

optionalAuthRouter.route(
  getArticlesRoute,
  async ({ input, context, h }, next) => {
    try {
      const result = await getArticles(context.user, input.query);

      h.json({ data: result });
    } catch (error) {
      next(error);
    }
  },
);

requiredAuthRouter.route(
  createArticleRoute,
  async ({ input, context, h }, next) => {
    try {
      const result = await createArticle(context.user, input.json.article);

      h.json({ status: 201, data: { article: result } });
    } catch (error) {
      next(error);
    }
  },
);

optionalAuthRouter.route(
  getArticleRoute,
  async ({ input, context, h }, next) => {
    try {
      const result = await getArticle(input.param.slug, context.user);

      h.json({ data: { article: result } });
    } catch (error) {
      next(error);
    }
  },
);

requiredAuthRouter.route(
  updateArticleRoute,
  async ({ input, context, h }, next) => {
    try {
      const result = await updateArticle(
        context.user,
        input.param.slug,
        input.json.article,
      );

      h.json({ data: { article: result } });
    } catch (error) {
      next(error);
    }
  },
);

requiredAuthRouter.route(
  deleteArticleRoute,
  async ({ input, context, res }, next) => {
    try {
      await deleteArticle(context.user, input.param.slug);
      res.send();
    } catch (error) {
      next(error);
    }
  },
);

requiredAuthRouter.route(
  favoriteArticleRoute,
  async ({ input, context, h }, next) => {
    try {
      const result = await favoriteArticle(context.user, input.param.slug);

      h.json({ data: { article: result } });
    } catch (error) {
      next(error);
    }
  },
);

requiredAuthRouter.route(
  unfavoriteArticleRoute,
  async ({ input, context, h }, next) => {
    try {
      const result = await unfavoriteArticle(context.user, input.param.slug);

      h.json({ data: { article: result } });
    } catch (error) {
      next(error);
    }
  },
);

articlesRouter.use('', requiredAuthRouter);
articlesRouter.use('', optionalAuthRouter);
