import { User } from './generated';
import prisma from './prisma';

export async function commentCreate(
  slug: string,
  content: string,
  author: User,
) {
  const comment = await prisma.comment.create({
    data: { body: content, authorUsername: author.username, articleSlug: slug },
    include: { author: { include: { followedBy: true } } },
  });
  return comment;
}

export async function commentsGet(slug: string, user?: User) {
  const comments = prisma.comment.findMany({
    where: { articleSlug: slug },
    include: {
      author: {
        include: { followedBy: { where: { username: user?.username } } },
      },
    },
  });
  return comments;
}

export async function commentDelete(id: number, user: User) {
  // See if user is the author of the comment it wants to delete
  await prisma.comment.findFirstOrThrow({
    where: { id, authorUsername: user.username },
    include: { author: true },
  });

  // Delete the comment from the database.
  const deletedComment = await prisma.comment.delete({
    where: { id },
    include: {
      author: {
        include: { followedBy: { where: { username: user.username } } },
      },
    },
  });
  return deletedComment;
}
