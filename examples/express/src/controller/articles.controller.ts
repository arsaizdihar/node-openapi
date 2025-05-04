import { createAuthFactory, createCheckedAuthFactory } from '../factories';
import {
  createArticleRoute,
  deleteArticleRoute,
  getArticleRoute,
  getArticlesFeedRoute,
  getArticlesRoute,
  updateArticleRoute,
} from '../routes/articles.routes';
import {
  createArticle,
  deleteArticle,
  getArticle,
  getArticles,
  getArticlesFeed,
  updateArticle,
} from 'ws-common/service/articles.service';

export const articlesController = createCheckedAuthFactory();

const authFactory = createAuthFactory();

authFactory.route(getArticlesFeedRoute, async (_, res, next) => {
  try {
    const result = await getArticlesFeed(res.locals.user, res.locals.query);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

articlesController.route(getArticlesRoute, async (_, res, next) => {
  try {
    const result = await getArticles(
      res.locals.user ?? undefined,
      res.locals.query,
    );

    res.json(result);
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

    res.json(result);
  } catch (error) {
    next(error);
  }
});

authFactory.route(getArticleRoute, async (_, res, next) => {
  try {
    const result = await getArticle(res.locals.user, res.locals.params.slug);

    res.json(result);
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

    res.json(result);
  } catch (error) {
    next(error);
  }
});

authFactory.route(deleteArticleRoute, async (_, res, next) => {
  try {
    const result = await deleteArticle(res.locals.user, res.locals.params.slug);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

articlesController.router('', authFactory);
