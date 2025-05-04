import {
  DefaultError,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { queryClient } from '~shared/queryClient';
import { ARTICLES_ROOT_QUERY_KEY } from '~entities/article/article.api';
import { Article } from '~entities/article/article.types';
import { UpdateArticle } from './update-article.types';
import { putApiArticlesBySlug } from '~shared/api';

export function useUpdateArticleMutation(
  options: Pick<
    UseMutationOptions<Article, DefaultError, UpdateArticle, unknown>,
    'mutationKey' | 'onMutate' | 'onSuccess' | 'onError' | 'onSettled'
  > = {},
) {
  const { mutationKey = [], onMutate, onSuccess, onError, onSettled } = options;

  return useMutation({
    mutationKey: ['article', 'update', ...mutationKey],

    mutationFn: async (updateArticleData: UpdateArticle) => {
      const { slug } = updateArticleData;
      const { data } = await putApiArticlesBySlug({
        path: { slug },
        body: { article: updateArticleData },
      });
      return data.article;
    },

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
