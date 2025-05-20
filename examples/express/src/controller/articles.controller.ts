import { ExpressRouteFactory } from '@node-openapi/express';
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

export const articlesController = new ExpressRouteFactory();

const optionalAuthFactory = createOptionalAuthFactory();

const requiredAuthFactory = createRequiredAuthFactory();

requiredAuthFactory.route(
  getArticlesFeedRoute,
  async ({ input, context, h }, next) => {
    try {
      const result = await getArticlesFeed(context.user, input.query);

      h.json({ status: 200, data: result });
    } catch (error) {
      next(error);
    }
  },
);

optionalAuthFactory.route(
  getArticlesRoute,
  async ({ input, context, h }, next) => {
    try {
      const result = await getArticles(context.user, input.query);

      h.json({ status: 200, data: result });
    } catch (error) {
      next(error);
    }
  },
);

requiredAuthFactory.route(
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

optionalAuthFactory.route(
  getArticleRoute,
  async ({ input, context, h }, next) => {
    try {
      const result = await getArticle(input.param.slug, context.user);

      h.json({ status: 200, data: { article: result } });
    } catch (error) {
      next(error);
    }
  },
);

requiredAuthFactory.route(
  updateArticleRoute,
  async ({ input, context, h }, next) => {
    try {
      const result = await updateArticle(
        context.user,
        input.param.slug,
        input.json.article,
      );

      h.json({ status: 200, data: { article: result } });
    } catch (error) {
      next(error);
    }
  },
);

requiredAuthFactory.route(
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

requiredAuthFactory.route(
  favoriteArticleRoute,
  async ({ input, context, h }, next) => {
    try {
      const result = await favoriteArticle(context.user, input.param.slug);

      h.json({ status: 200, data: { article: result } });
    } catch (error) {
      next(error);
    }
  },
);

requiredAuthFactory.route(
  unfavoriteArticleRoute,
  async ({ input, context, h }, next) => {
    try {
      const result = await unfavoriteArticle(context.user, input.param.slug);

      h.json({ status: 200, data: { article: result } });
    } catch (error) {
      next(error);
    }
  },
);

articlesController.router('', requiredAuthFactory);
articlesController.router('', optionalAuthFactory);
