import { queryOptions } from '@tanstack/react-query';
import { getApiUser } from '~shared/api';
import { queryClient } from '~shared/queryClient';
import { User } from './session.types';

export const sessionQueryOptions = queryOptions({
  queryKey: ['session', 'current-user'],

  queryFn: async ({ signal }) => {
    const { data } = await getApiUser({ signal });
    return data.user;
  },

  initialData: () =>
    queryClient.getQueryData<User>(['session', 'current-user']),

  initialDataUpdatedAt: () =>
    queryClient.getQueryState(['session', 'current-user'])?.dataUpdatedAt,
});
