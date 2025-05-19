import { NextResponse } from 'next/server';
import { NextRouteFactory } from '@node-openapi/next';
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

export const articlesController = new NextRouteFactory();

const optionalAuthFactory = createOptionalAuthFactory();

const requiredAuthFactory = createRequiredAuthFactory();

requiredAuthFactory.route(
  getArticlesFeedRoute,
  async (req, { input, context }) => {
    const result = await getArticlesFeed(context.user, input.query);

    return NextResponse.json(result);
  },
);

optionalAuthFactory.route(getArticlesRoute, async (req, { input, context }) => {
  const result = await getArticles(context.user ?? undefined, input.query);

  return NextResponse.json(result);
});

requiredAuthFactory.route(
  createArticleRoute,
  async (req, { input, context }) => {
    const result = await createArticle(context.user, input.json.article);

    return NextResponse.json({ article: result }, { status: 201 });
  },
);

optionalAuthFactory.route(getArticleRoute, async (req, { input, context }) => {
  const result = await getArticle(input.param.slug, context.user ?? undefined);

  return NextResponse.json({ article: result });
});

requiredAuthFactory.route(
  updateArticleRoute,
  async (req, { input, context }) => {
    const result = await updateArticle(
      context.user,
      input.param.slug,
      input.json.article,
    );

    return NextResponse.json({ article: result });
  },
);

requiredAuthFactory.route(
  deleteArticleRoute,
  async (req, { input, context }) => {
    await deleteArticle(context.user, input.param.slug);

    return NextResponse.json({}, { status: 200 });
  },
);

requiredAuthFactory.route(
  favoriteArticleRoute,
  async (req, { input, context }) => {
    const result = await favoriteArticle(context.user, input.param.slug);

    return NextResponse.json({ article: result });
  },
);

requiredAuthFactory.route(
  unfavoriteArticleRoute,
  async (req, { input, context }) => {
    const result = await unfavoriteArticle(context.user, input.param.slug);

    return NextResponse.json({ article: result });
  },
);

articlesController.router('', requiredAuthFactory);
articlesController.router('', optionalAuthFactory);
