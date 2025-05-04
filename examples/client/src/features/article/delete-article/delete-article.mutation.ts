import {
  DefaultError,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { queryClient } from '~shared/queryClient';
import { ARTICLES_ROOT_QUERY_KEY } from '~entities/article/article.api';
import { deleteApiArticlesBySlug } from '~shared/api';

export function useDeleteArticleMutation(
  options: Pick<
    UseMutationOptions<unknown, DefaultError, string, unknown>,
    'mutationKey' | 'onMutate' | 'onSuccess' | 'onError' | 'onSettled'
  > = {},
) {
  const { mutationKey = [], onMutate, onSuccess, onError, onSettled } = options;

  return useMutation({
    mutationKey: ['article', 'delete', ...mutationKey],

    mutationFn: (slug: string) => deleteApiArticlesBySlug({ path: { slug } }),

    onMutate,

    onSuccess: async (data, variables, context) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ARTICLES_ROOT_QUERY_KEY }),
        onSuccess?.(data, variables, context),
      ]);
    },

    onError,

    onSettled,
  });
}
