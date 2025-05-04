import { ExpressRouteFactory } from '@node-openapi/express';
import { createAuthFactory, createCheckedAuthFactory } from '../factories';
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

const checkedAuthFactory = createCheckedAuthFactory();

const authFactory = createAuthFactory();

authFactory.route(getArticlesFeedRoute, async (_, res, next) => {
  try {
    const result = await getArticlesFeed(res.locals.user, res.locals.query);

    res.locals.helper.json({ status: 200, data: result });
  } catch (error) {
    next(error);
  }
});

checkedAuthFactory.route(getArticlesRoute, async (_, res, next) => {
  try {
    const result = await getArticles(
      res.locals.user ?? undefined,
      res.locals.query,
    );

    res.locals.helper.json({ status: 200, data: result });
  } catch (error) {
    next(error);
  }
});

authFactory.route(createArticleRoute, async (_, res, next) => {
  try {
    const result = await createArticle(
      res.locals.user,
      res.locals.json.article,
    );

    res.locals.helper.json({ status: 201, data: { article: result } });
  } catch (error) {
    next(error);
  }
});

checkedAuthFactory.route(getArticleRoute, async (_, res, next) => {
  try {
    const result = await getArticle(
      res.locals.params.slug,
      res.locals.user ?? undefined,
    );

    res.locals.helper.json({ status: 200, data: { article: result } });
  } catch (error) {
    next(error);
  }
});

authFactory.route(updateArticleRoute, async (_, res, next) => {
  try {
    const result = await updateArticle(
      res.locals.user,
      res.locals.params.slug,
      res.locals.json.article,
    );

    res.locals.helper.json({ status: 200, data: { article: result } });
  } catch (error) {
    next(error);
  }
});

authFactory.route(deleteArticleRoute, async (_, res, next) => {
  try {
    await deleteArticle(res.locals.user, res.locals.params.slug);
    res.status(200).send();
  } catch (error) {
    next(error);
  }
});

authFactory.route(favoriteArticleRoute, async (_, res, next) => {
  try {
    const result = await favoriteArticle(
      res.locals.user,
      res.locals.params.slug,
    );

    res.locals.helper.json({ status: 200, data: { article: result } });
  } catch (error) {
    next(error);
  }
});

authFactory.route(unfavoriteArticleRoute, async (_, res, next) => {
  try {
    const result = await unfavoriteArticle(
      res.locals.user,
      res.locals.params.slug,
    );

    res.locals.helper.json({ status: 200, data: { article: result } });
  } catch (error) {
    next(error);
  }
});

articlesController.router('', authFactory);
articlesController.router('', checkedAuthFactory);
