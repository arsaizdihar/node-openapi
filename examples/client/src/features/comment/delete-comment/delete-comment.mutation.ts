import {
  DefaultError,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { queryClient } from '~shared/queryClient';
import { commentsQueryOptions } from '~entities/comment/comment.api';
import { deleteApiArticlesBySlugCommentsById } from '~shared/api';

export function useDeleteCommentMutation(
  options: Pick<
    UseMutationOptions<
      unknown,
      DefaultError,
      { id: number; slug: string },
      unknown
    >,
    'mutationKey' | 'onMutate' | 'onSuccess' | 'onError' | 'onSettled'
  > = {},
) {
  const { mutationKey = [], onMutate, onSuccess, onError, onSettled } = options;

  return useMutation({
    mutationKey: ['comment', 'delete', ...mutationKey],

    mutationFn: ({ id, slug }: { id: number; slug: string }) =>
      deleteApiArticlesBySlugCommentsById({
        path: { slug, id },
      }),

    onMutate,

    onSuccess: async (comment, createComment, context) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: commentsQueryOptions(createComment.slug).queryKey,
        }),
        onSuccess?.(comment, createComment, context),
      ]);
    },

    onError,

    onSettled,
  });
}
