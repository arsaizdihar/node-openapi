import { NextRouteFactory, z } from '@node-openapi/next';

import { createRoute } from '@node-openapi/next';
import { NextResponse } from 'next/server';
import { loginUserSchema, userSchema } from 'ws-common/domain/user.domain';
import { loginUser } from 'ws-common/service/user.service';

export const loginController = new NextRouteFactory();

const loginRoute = createRoute({
  tags: ['user'],
  method: 'post',
  description: 'Existing user login',
  summary: 'Login',
  path: '/users/login',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            user: loginUserSchema,
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            user: userSchema,
          }),
        },
      },
      description: 'User logged in',
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

loginController.handler(loginRoute, async (req, ctx) => {
  const { user } = ctx.input.json;
  const result = await loginUser(user);
  return NextResponse.json({ user: result });
});

export const { POST } = loginController.handlers;
