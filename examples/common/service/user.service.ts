import {
  userCreate,
  UserDB,
  userFollowProfile,
  userGet,
  userGetByEmail,
  userUnFollowProfile,
  userUpdate,
} from 'ws-db';
import {
  LoginUser,
  Profile,
  RegisterUser,
  TokenPayload,
  tokenPayloadSchema,
  UpdateUser,
  User,
} from '../domain/user.domain';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { HttpError } from './error.service';

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET missing in environment.');
}

export async function getUserByToken(token: string) {
  try {
    const payload = tokenPayloadSchema.parse(jwt.verify(token, JWT_SECRET));
    const username = payload.user.username;
    const user = await userGet(username);
    return user ? toUserView(user, token) : null;
  } catch {
    return null;
  }
}

export async function updateUser(username: string, updateUser: UpdateUser) {
  const hashedPassword = updateUser.password
    ? await hashPassword(updateUser.password)
    : undefined;

  const user = await userUpdate(username, {
    ...updateUser,
    password: hashedPassword,
  });
  if (!user) {
    throw new UserNotFoundError('User not found');
  }

  const token = createUserToken(user);
  return toUserView(user, token);
}

export async function loginUser(payload: LoginUser) {
  const user = await userGetByEmail(payload.email);
  if (!user) {
    throw new UserNotFoundError('User not found');
  }

  if (!compareWithHash(user.password, user.password)) {
    throw new InvalidCredentialsError('Invalid credentials');
  }

  const token = createUserToken(user);
  return toUserView(user, token);
}

export async function registerUser(payload: RegisterUser) {
  const existingUser = await userGetByEmail(payload.email);
  if (existingUser) {
    throw new UserAlreadyExistsError('User already exists');
  }

  const hashedPassword = await hashPassword(payload.password);

  const user = await userCreate(
    payload.username,
    payload.email,
    hashedPassword,
  );
  const token = createUserToken(user);
  return toUserView(user, token);
}

function createUserToken(user: { username: string; email: string }) {
  const tokenObject: TokenPayload = {
    user: { username: user.username, email: user.email },
  };
  const userJSON = JSON.stringify(tokenObject);
  const token = jwt.sign(userJSON, JWT_SECRET);
  return token;
}

export async function getProfile(username: string, currentUser?: User) {
  const user = await userGet(username);
  if (!user) {
    throw new UserNotFoundError('User not found');
  }
  return toProfileView(user, currentUser);
}

export async function followProfile(currentUser: User, username: string) {
  const profile = await userFollowProfile(currentUser.id, username);
  return toProfileView(profile, currentUser);
}

export async function unfollowProfile(currentUser: User, username: string) {
  const profile = await userUnFollowProfile(currentUser.id, username);
  return toProfileView(profile, currentUser);
}

async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

function compareWithHash(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function toUserView(user: UserDB, token: string): User {
  return {
    id: user.id,
    email: user.email,
    token,
    username: user.username,
    bio: user.bio ?? '',
    image: user.image ?? '',
  };
}

type UserWithoutPassword = Omit<UserDB, 'password'>;
export type UserWithFollow = UserWithoutPassword & {
  followedBy: UserWithoutPassword[];
};

export function toProfileView(
  user: UserWithFollow,
  currentUser?: UserWithoutPassword,
): Profile {
  const follows = currentUser
    ? Boolean(
        user.followedBy.find((value) => value.username == currentUser.username),
      )
    : false;
  return {
    username: user.username,
    bio: user.bio ?? '',
    image: user.image ?? '',
    following: follows,
  };
}

export class UserNotFoundError extends HttpError {
  constructor(message: string) {
    super(message, 404);
    this.name = 'UserNotFoundError';
  }
}

export class InvalidCredentialsError extends HttpError {
  constructor(message: string) {
    super(message, 401);
    this.name = 'InvalidCredentialsError';
  }
}

export class UserAlreadyExistsError extends HttpError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'UserAlreadyExistsError';
  }
}
