import { UserDB } from 'ws-db';

export default function userViewer(user: UserDB, token: string) {
  const userView = {
    user: {
      email: user.email,
      token: token,
      username: user.username,
      bio: user.bio,
      image: user.image,
    },
  };
  return userView;
}
