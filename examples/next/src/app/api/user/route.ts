import { NextRouteFactory, z } from '@node-openapi/next';

import { createRoute } from '@node-openapi/next';
import {
  registerUserSchema,
  updateUserSchema,
  userSchema,
} from 'ws-common/domain/user.domain';
import { defaultRouteSecurity } from '../security';
import { registerUser, updateUser } from 'ws-common/service/user.service';
import { NextResponse } from 'next/server';
import { createRequiredAuthFactory } from '../factories';
import { loginController } from './login/route';

export const userController = new NextRouteFactory();
const requiredAuthFactory = createRequiredAuthFactory();

const registerRoute = createRoute({
  tags: ['user'],
  method: 'post',
  description: 'Register a new user',
  summary: 'Register',
  path: '/users',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            user: registerUserSchema,
          }),
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: z.object({
            user: userSchema,
          }),
        },
      },
      description: 'User registered',
    },
  },
});

const getCurrentUserRoute = createRoute({
  tags: ['user'],
  method: 'get',
  description: 'Get current user',
  summary: 'Get current user',
  path: '/user',
  security: defaultRouteSecurity,
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            user: userSchema,
          }),
        },
      },
      description: 'Current user',
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

const updateUserRoute = createRoute({
  tags: ['user'],
  method: 'put',
  description: 'Update current user',
  summary: 'Update current user',
  path: '/user',
  security: defaultRouteSecurity,
  request: {
    body: {
      content: {
        'application/json': { schema: z.object({ user: updateUserSchema }) },
      },
    },
  },
  responses: {
    200: {
      description: 'User updated',
      content: {
        'application/json': { schema: z.object({ user: userSchema }) },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

userController.handler(registerRoute, async (req, ctx) => {
  const { user } = ctx.input.json;
  const result = await registerUser(user);
  return NextResponse.json({ user: result });
});

requiredAuthFactory.handler(getCurrentUserRoute, async (req, ctx) => {
  const user = ctx.user;
  return NextResponse.json({ user });
});

requiredAuthFactory.handler(updateUserRoute, async (req, ctx) => {
  const { user } = ctx.input.json;
  const currentUser = ctx.user;
  const result = await updateUser(currentUser.username, user);
  return NextResponse.json({ user: result });
});

export const { GET, POST, PUT } = userController
  .merge(requiredAuthFactory)
  .router(loginController).handlers;
