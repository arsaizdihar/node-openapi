import {
  DefaultError,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { sessionQueryOptions } from '~entities/session/session.api';
import { setSession } from '~entities/session/session.model';
import type { User } from '~entities/session/session.types';
import { postApiUsersLogin } from '~shared/api';
import { queryClient } from '~shared/queryClient';
import { store } from '~shared/store';
import type { LoginUser } from './login.types';

export function useLoginMutation(
  options: Pick<
    UseMutationOptions<User, DefaultError, LoginUser, unknown>,
    'mutationKey' | 'onMutate' | 'onSuccess' | 'onError' | 'onSettled'
  > = {},
) {
  const { mutationKey = [], onMutate, onSuccess, onError, onSettled } = options;

  return useMutation({
    mutationKey: ['session', 'login-user', ...mutationKey],

    mutationFn: async (loginUserData: LoginUser) => {
      const { data } = await postApiUsersLogin({
        body: { user: loginUserData },
      });
      return data.user;
    },

    onMutate,

    onSuccess: async (data, variables, context) => {
      store.dispatch(setSession(data));
      queryClient.setQueryData(sessionQueryOptions.queryKey, data);
      await onSuccess?.(data, variables, context);
    },

    onError,

    onSettled,
  });
}
