import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import {
  getApiArticles,
  getApiArticlesBySlug,
  getApiArticlesFeed,
} from '~shared/api';
import { queryClient } from '~shared/queryClient';
import { Article, FilterQuery } from './article.types';

export const ARTICLES_ROOT_QUERY_KEY = ['articles'];

export const articleQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: [...ARTICLES_ROOT_QUERY_KEY, slug],

    queryFn: async ({ signal }) => {
      const { data } = await getApiArticlesBySlug({
        path: { slug },
        signal,
      });
      return data.article;
    },

    initialData: () => queryClient.getQueryData<Article>(['article', slug]),

    initialDataUpdatedAt: () =>
      queryClient.getQueryState(['article', slug])?.dataUpdatedAt,
  });

export const articlesQueryOptions = (filter: FilterQuery) => {
  const { source } = filter;
  const isGlobal = source === 'global';

  return queryOptions({
    queryKey: [...ARTICLES_ROOT_QUERY_KEY, filter],

    queryFn: async ({ signal }) => {
      const config = { signal, params: filter };
      const request = isGlobal
        ? getApiArticles(config)
        : getApiArticlesFeed(config);
      const { data } = await request;
      return data;
    },

    placeholderData: keepPreviousData,

    initialData: () =>
      queryClient.getQueryData<{
        articles: Array<Article>;
        articlesCount: number;
      }>([...ARTICLES_ROOT_QUERY_KEY, filter]),

    initialDataUpdatedAt: () =>
      queryClient.getQueryState([...ARTICLES_ROOT_QUERY_KEY, filter])
        ?.dataUpdatedAt,
  });
};
