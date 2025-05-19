import { NextRouteFactory } from '@node-openapi/next';
import { articlesController } from './articles/route';
import { profileController } from './profiles/[username]/route';
import { tagsController } from './tags/route';
import { userController } from './user/route';

export const mainFactory = new NextRouteFactory().router(
  articlesController,
  profileController,
  tagsController,
  userController,
);
