import { HonoRouteFactory } from '@node-openapi/hono';
import {
  createOptionalAuthFactory,
  createRequiredAuthFactory,
} from '../factories';
import {
  listArticlesRoute,
  feedArticlesRoute,
  getArticleRoute,
  createArticleRoute,
  updateArticleRoute,
  deleteArticleRoute,
  favoriteArticleRoute,
  unfavoriteArticleRoute,
} from '../routes/articles.routes';
import {
  getArticles,
  getArticlesFeed,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  favoriteArticle,
  unfavoriteArticle,
} from 'ws-common/service/articles.service';

const publicArticleController = createOptionalAuthFactory();

// For routes requiring authentication
const authArticleController = createRequiredAuthFactory();

publicArticleController.route(listArticlesRoute, async (c) => {
  const query = c.req.valid('query');
  const currentUser = c.get('user');
  const result = await getArticles(currentUser ?? undefined, query);
  return c.json(result);
});

authArticleController.route(feedArticlesRoute, async (c) => {
  const query = c.req.valid('query');
  const currentUser = c.get('user');
  const result = await getArticlesFeed(currentUser, query);
  return c.json(result);
});

publicArticleController.route(getArticleRoute, async (c) => {
  console.log('feed');
  const { slug } = c.req.valid('param');
  const currentUser = c.get('user');
  const result = await getArticle(slug, currentUser ?? undefined);
  return c.json({ article: result });
});

authArticleController.route(createArticleRoute, async (c) => {
  const { article: newArticleData } = c.req.valid('json');
  const currentUser = c.get('user');
  const result = await createArticle(currentUser, newArticleData);
  return c.json({ article: result }, 201);
});

authArticleController.route(updateArticleRoute, async (c) => {
  const { slug } = c.req.valid('param');
  const { article: articleUpdateData } = c.req.valid('json');
  const currentUser = c.get('user');
  const result = await updateArticle(currentUser, slug, articleUpdateData);
  return c.json({ article: result });
});

authArticleController.route(deleteArticleRoute, async (c) => {
  const { slug } = c.req.valid('param');
  const currentUser = c.get('user');
  await deleteArticle(currentUser, slug);
  return c.body(null, 204);
});

authArticleController.route(favoriteArticleRoute, async (c) => {
  const { slug } = c.req.valid('param');
  const currentUser = c.get('user');
  const result = await favoriteArticle(currentUser, slug);
  return c.json({ article: result });
});

authArticleController.route(unfavoriteArticleRoute, async (c) => {
  const { slug } = c.req.valid('param');
  const currentUser = c.get('user');
  const result = await unfavoriteArticle(currentUser, slug);
  return c.json({ article: result });
});

export const articlesController = new HonoRouteFactory();
articlesController.router('', authArticleController);
articlesController.router('', publicArticleController);
