import { createRoute, z } from '@node-openapi/express';
import {
  loginUserSchema,
  registerUserSchema,
  userSchema,
} from 'ws-common/domain/user.domain';
import { defaultRouteSecurity } from './security';

export const loginRoute = createRoute({
  tags: ['user'],
  method: 'post',
  description: 'Existing user login',
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

export const registerRoute = createRoute({
  tags: ['user'],
  method: 'post',
  description: 'Register a new user',
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

export const getCurrentUserRoute = createRoute({
  tags: ['user'],
  method: 'get',
  description: 'Get current user',
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

export const updateUserRoute = createRoute({
  tags: ['user'],
  method: 'put',
  description: 'Update current user',
  path: '/user',
  security: defaultRouteSecurity,
  request: {
    body: {
      content: {
        'application/json': { schema: z.object({ user: userSchema }) },
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
