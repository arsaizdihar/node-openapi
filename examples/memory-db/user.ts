import { memoryStore } from './store';
import { UserDB } from './types';

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
  const user = memoryStore.createUser({
    username,
    email,
    password,
    bio: null,
    image: null,
  });
  return user;
}

export async function userFollowProfile(
  currentUserId: number,
  followUsername: string,
) {
  const userToFollow = memoryStore.getUserByUsername(followUsername);
  if (!userToFollow) {
    throw new Error('User to follow not found');
  }

  memoryStore.addUserFollow(currentUserId, userToFollow.id);
  
  // Return user with followers included (matching Prisma include behavior)
  const followers = memoryStore.getUserFollowers(userToFollow.id);
  const followedBy = followers.map(id => memoryStore.getUserById(id)).filter(Boolean) as UserDB[];
  
  return {
    ...userToFollow,
    followedBy,
  };
}

export async function userGetByEmail(email: string) {
  if (!email) return null;
  
  const user = memoryStore.getUserByEmail(email);
  if (!user) return null;

  // Include related data to match Prisma behavior
  const follows = memoryStore.getUserFollows(user.id)
    .map(id => memoryStore.getUserById(id))
    .filter(Boolean) as UserDB[];
  
  const followedBy = memoryStore.getUserFollowers(user.id)
    .map(id => memoryStore.getUserById(id))
    .filter(Boolean) as UserDB[];
  
  const authored = memoryStore.getArticlesByAuthor(user.id);
  const favorites = memoryStore.getUserFavoriteArticles(user.id)
    .map(slug => memoryStore.getArticleBySlug(slug))
    .filter(Boolean);

  return {
    ...user,
    follows,
    followedBy,
    authored,
    favorites,
  };
}

export async function userGet(username: string) {
  if (!username) return null;
  
  const user = memoryStore.getUserByUsername(username);
  if (!user) return null;

  // Include related data to match Prisma behavior
  const follows = memoryStore.getUserFollows(user.id)
    .map(id => memoryStore.getUserById(id))
    .filter(Boolean) as UserDB[];
  
  const followedBy = memoryStore.getUserFollowers(user.id)
    .map(id => memoryStore.getUserById(id))
    .filter(Boolean) as UserDB[];
  
  const authored = memoryStore.getArticlesByAuthor(user.id);
  const favorites = memoryStore.getUserFavoriteArticles(user.id)
    .map(slug => memoryStore.getArticleBySlug(slug))
    .filter(Boolean);

  return {
    ...user,
    follows,
    followedBy,
    authored,
    favorites,
  };
}

export async function userUnFollowProfile(
  currentUserId: number,
  unFollowUsername: string,
) {
  const userToUnfollow = memoryStore.getUserByUsername(unFollowUsername);
  if (!userToUnfollow) {
    throw new Error('User to unfollow not found');
  }

  memoryStore.removeUserFollow(currentUserId, userToUnfollow.id);
  
  // Return user with followers included (matching Prisma include behavior)
  const followers = memoryStore.getUserFollowers(userToUnfollow.id);
  const followedBy = followers.map(id => memoryStore.getUserById(id)).filter(Boolean) as UserDB[];
  
  return {
    ...userToUnfollow,
    followedBy,
  };
}

export async function userUpdate(username: string, info: UpdateFields) {
  if (!username) return null;
  
  const user = memoryStore.getUserByUsername(username);
  if (!user) return null;
  
  const updatedUser = memoryStore.updateUser(user.id, info);
  return updatedUser;
}