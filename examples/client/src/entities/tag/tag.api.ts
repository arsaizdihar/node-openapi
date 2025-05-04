import { queryOptions } from '@tanstack/react-query';
import { queryClient } from '~shared/queryClient';
import { Tags } from './tag.types';
import { getApiTags } from '~shared/api';

export const tagsQueryOptions = queryOptions({
  queryKey: ['tags'],

  queryFn: async ({ signal }) => {
    const { data } = await getApiTags({ signal });
    return data.tags;
  },

  initialData: () => queryClient.getQueryData<Tags>(['tags']),

  initialDataUpdatedAt: () =>
    queryClient.getQueryState(['tags'])?.dataUpdatedAt,
});
