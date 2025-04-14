import { createRoute } from '@node-openapi/express';
import { userSchema } from 'ws-common/domain/user.domain';
import { errorSchema } from 'ws-common/domain/errors.domain';
import { loginSchema, registerSchema } from 'ws-common/domain/auth.domain';

export const loginRoute = createRoute({
  tags: ['user'],
  method: 'post',
  path: '/login',
  request: {
    body: {
      content: {
        'application/json': {
          schema: loginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Login successful',
      content: {
        'application/json': {
          schema: userSchema,
        },
      },
    },
    401: {
      description: 'Invalid credentials',
      content: {
        'application/json': {
          schema: errorSchema,
        },
      },
    },
  },
});

export const registerRoute = createRoute({
  tags: ['user'],
  method: 'post',
  path: '/register',
  request: {
    body: {
      content: {
        'application/json': {
          schema: registerSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Register successful',
      content: {
        'application/json': {
          schema: userSchema,
        },
      },
    },
  },
});

export const logoutRoute = createRoute({
  tags: ['user'],
  method: 'post',
  path: '/logout',
  responses: {
    200: {
      description: 'Logout successful',
    },
  },
});

export const meRoute = createRoute({
  tags: ['user'],
  method: 'get',
  path: '/me',
  responses: {
    200: {
      description: 'User details',
      content: {
        'application/json': {
          schema: userSchema.nullable(),
        },
      },
    },
  },
});
