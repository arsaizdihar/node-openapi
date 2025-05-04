import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { DefaultError, UseMutationOptions } from '@tanstack/react-query'
import type { CreateArticle } from './create-article.types'
import type { Article } from '@/shared/api'
import { postApiArticles } from '@/shared/api'
import { ARTICLES_ROOT_QUERY_KEY } from '@/entities/article/article.api'

export function useCreateArticleMutation(
  options: Pick<
    UseMutationOptions<Article, DefaultError, CreateArticle, unknown>,
    'mutationKey' | 'onMutate' | 'onSuccess' | 'onError' | 'onSettled'
  > = {},
) {
  const { mutationKey = [], onMutate, onSuccess, onError, onSettled } = options
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['article', 'create', ...mutationKey],

    mutationFn: async (createArticleData: CreateArticle) => {
      const { data } = await postApiArticles({
        body: {
          article: {
            ...createArticleData,
            tagList:
              createArticleData.tagList?.split(', ').filter(Boolean) ?? [],
          },
        },
      })
      return data.article
    },

    onMutate,

    onSuccess: async (data, variables, context) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ARTICLES_ROOT_QUERY_KEY }),
        onSuccess?.(data, variables, context),
      ])
    },

    onError,

    onSettled,
  })
}
