import { User } from './generated';
import prisma from './prisma';

interface UpdateFields {
  email?: string;
  username?: string;
  password?: string;
  image?: string;
  bio?: string;
}

export async function userCreate(
  username: string,
  email: string,
  password: string,
) {
  const user = await prisma.user.create({
    data: { username, email, password },
  });
  return user;
}

export async function userFollowProfile(
  currentUser: User,
  followUsername: string,
) {
  const followed = await prisma.user.update({
    where: { username: followUsername },
    data: { followedBy: { connect: { username: currentUser.username } } },
    include: { followedBy: { where: { username: currentUser.username } } },
  });
  return followed;
}

export async function userGetByEmail(email: string) {
  if (!email) return null;
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      follows: true,
      followedBy: true,
      authored: true,
      favorites: true,
    },
  });
  return user;
}

export async function userGet(username: string) {
  if (!username) return null;
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      follows: true,
      followedBy: true,
      authored: true,
      favorites: true,
    },
  });
  return user;
}

export async function userUnFollowProfile(
  currentUser: User,
  unFollowUsername: string,
) {
  const follows = await prisma.user.update({
    where: { username: unFollowUsername },
    data: { followedBy: { disconnect: { username: currentUser.username } } },
    include: { followedBy: { where: { username: currentUser.username } } },
  });
  return follows;
}

export async function userUpdate(username: string, info: UpdateFields) {
  if (!username) return null;
  const user = await prisma.user.update({ where: { username }, data: info });
  return user;
}
