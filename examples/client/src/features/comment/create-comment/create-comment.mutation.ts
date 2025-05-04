import {
  DefaultError,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { commentsQueryOptions } from '~entities/comment/comment.api';
import { Comment } from '~entities/comment/comment.types';
import { postApiArticlesBySlugComments } from '~shared/api';
import { queryClient } from '~shared/queryClient';
import { CreateComment } from './create-comment.types';

export function useCreateCommentMutation(
  options: Pick<
    UseMutationOptions<Comment, DefaultError, CreateComment, unknown>,
    'mutationKey' | 'onMutate' | 'onSuccess' | 'onError' | 'onSettled'
  > = {},
) {
  const { mutationKey = [], onMutate, onSuccess, onError, onSettled } = options;

  return useMutation({
    mutationKey: ['comment', 'create', ...mutationKey],

    mutationFn: async (createCommentData: CreateComment) => {
      const { data } = await postApiArticlesBySlugComments({
        path: { slug: createCommentData.slug },
        body: { comment: createCommentData },
      });
      return data.comment;
    },

    onMutate,

    onSuccess: async (comment, createCommentData, context) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: commentsQueryOptions(createCommentData.slug).queryKey,
        }),
        onSuccess?.(comment, createCommentData, context),
      ]);
    },

    onError,

    onSettled,
  });
}
