import prisma from './prisma';

export async function commentCreate(
  slug: string,
  content: string,
  authorId: number,
) {
  const comment = await prisma.comment.create({
    data: { body: content, authorId, articleSlug: slug },
    include: { author: { include: { followedBy: true } } },
  });
  return comment;
}

export async function commentsGet(slug: string, userId?: number) {
  const comments = prisma.comment.findMany({
    where: { articleSlug: slug },
    include: {
      author: {
        include: { followedBy: { where: { id: userId } } },
      },
    },
  });
  return comments;
}

export async function commentDelete(slug: string, id: number, userId: number) {
  // See if user is the author of the comment it wants to delete
  await prisma.comment.findFirstOrThrow({
    where: { id, articleSlug: slug, authorId: userId },
    include: { author: true },
  });

  // Delete the comment from the database.
  const deletedComment = await prisma.comment.delete({
    where: { id },
    include: {
      author: {
        include: { followedBy: { where: { id: userId } } },
      },
    },
  });
  return deletedComment;
}
