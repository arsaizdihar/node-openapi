import { queryOptions } from '@tanstack/react-query';
import { queryClient } from '~shared/queryClient';
import { Comments } from './comment.types';
import { getApiArticlesBySlugComments } from '~shared/api';

export const commentsQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ['comments', slug],

    queryFn: async ({ signal }) => {
      const { data } = await getApiArticlesBySlugComments({
        path: { slug },
        signal,
      });
      return data.comments;
    },

    initialData: () => queryClient.getQueryData<Comments>(['comments', slug]),

    initialDataUpdatedAt: () =>
      queryClient.getQueryState(['comments', slug])?.dataUpdatedAt,
  });
