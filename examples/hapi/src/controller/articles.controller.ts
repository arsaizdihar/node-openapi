import { HapiRouteFactory } from '@node-openapi/hapi';
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

export const articlesController = new HapiRouteFactory();

const checkedAuthFactory = createOptionalAuthFactory();

const authFactory = createRequiredAuthFactory();

authFactory.route(getArticlesFeedRoute, async (req, _h, { helper, input }) => {
  const result = await getArticlesFeed(req.app.user, input.query);

  return helper.json({ status: 200, data: result });
});

checkedAuthFactory.route(
  getArticlesRoute,
  async (req, _h, { helper, input }) => {
    const result = await getArticles(req.app.user ?? undefined, input.query);

    return helper.json({ status: 200, data: result });
  },
);

authFactory.route(createArticleRoute, async (req, _h, { helper, input }) => {
  const result = await createArticle(req.app.user, input.json.article);

  return helper.json({ status: 201, data: { article: result } });
});

checkedAuthFactory.route(
  getArticleRoute,
  async (req, _h, { helper, input }) => {
    const result = await getArticle(
      input.param.slug,
      req.app.user ?? undefined,
    );

    return helper.json({ status: 200, data: { article: result } });
  },
);

authFactory.route(updateArticleRoute, async (req, _h, { helper, input }) => {
  const result = await updateArticle(
    req.app.user,
    input.param.slug,
    input.json.article,
  );

  return helper.json({ status: 200, data: { article: result } });
});

authFactory.route(deleteArticleRoute, async (req, h, { input }) => {
  await deleteArticle(req.app.user, input.param.slug);
  return h.response().code(200);
});

authFactory.route(favoriteArticleRoute, async (req, _h, { helper, input }) => {
  const result = await favoriteArticle(req.app.user, input.param.slug);

  return helper.json({ status: 200, data: { article: result } });
});

authFactory.route(
  unfavoriteArticleRoute,
  async (req, _h, { helper, input }) => {
    const result = await unfavoriteArticle(req.app.user, input.param.slug);

    return helper.json({ status: 200, data: { article: result } });
  },
);

articlesController.router('', authFactory);
articlesController.router('', checkedAuthFactory);
