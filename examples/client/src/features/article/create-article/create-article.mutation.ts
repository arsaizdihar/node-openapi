import {
  DefaultError,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { ARTICLES_ROOT_QUERY_KEY } from '~entities/article/article.api';
import { Article } from '~entities/article/article.types';
import { postApiArticles } from '~shared/api';
import { queryClient } from '~shared/queryClient';
import { CreateArticle } from './create-article.types';

export function useCreateArticleMutation(
  options: Pick<
    UseMutationOptions<Article, DefaultError, CreateArticle, unknown>,
    'mutationKey' | 'onMutate' | 'onSuccess' | 'onError' | 'onSettled'
  > = {},
) {
  const { mutationKey = [], onMutate, onSuccess, onError, onSettled } = options;

  return useMutation({
    mutationKey: ['article', 'create', ...mutationKey],

    mutationFn: async (createArticleData: CreateArticle) => {
      const { data } = await postApiArticles({
        body: {
          article: {
            ...createArticleData,
            tagList: createArticleData.tagList?.split(',') ?? [],
          },
        },
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
