import { UserDB } from 'ws-db';

type UserWithFollow = UserDB & { followedBy: UserDB[] };

export default function profileViewer(
  user: UserWithFollow,
  currentUser?: UserDB,
) {
  const follows = currentUser
    ? Boolean(
        user.followedBy.find((value) => value.username == currentUser.username),
      )
    : false;
  const userView = {
    username: user.username,
    bio: user.bio,
    image: user.image,
    following: follows,
  };
  return userView;
}
