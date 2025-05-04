import { queryOptions } from '@tanstack/react-query';
import { queryClient } from '~shared/queryClient';
import { Profile } from './profie.types';
import { getApiProfilesByUsername } from '~shared/api';

export const profileQueryOptions = (username: string) =>
  queryOptions({
    queryKey: ['profile', username],

    queryFn: async ({ signal }) => {
      const { data } = await getApiProfilesByUsername({
        path: { username },
        signal,
      });
      return data.profile;
    },

    initialData: () => queryClient.getQueryData<Profile>(['profile', username]),

    initialDataUpdatedAt: () =>
      queryClient.getQueryState(['profile', username])?.dataUpdatedAt,
  });
