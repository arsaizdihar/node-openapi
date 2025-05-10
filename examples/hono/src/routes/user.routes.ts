import { createRoute, z } from '@node-openapi/hono';
import {
  loginUserSchema,
  registerUserSchema,
  updateUserSchema,
  userSchema,
} from 'ws-common/domain/user.domain';
import { defaultRouteSecurity } from './security';

const errorBodySchema = z.object({ body: z.array(z.string()) });
export const errorsSchema = z.object({ errors: errorBodySchema });

const unauthorizedResponse = {
  401: {
    description: 'Unauthorized',
    content: {
      'application/json': { schema: errorsSchema },
    },
  },
};

const validationErrorResponse = {
  422: {
    description: 'Unprocessable Entity (Validation Error)',
    content: {
      'application/json': { schema: errorsSchema },
    },
  },
};

export const loginRoute = createRoute({
  tags: ['User and Authentication'],
  method: 'post',
  path: '/users/login',
  description: 'Login for existing user',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ user: loginUserSchema }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'User logged in successfully',
      content: {
        'application/json': { schema: z.object({ user: userSchema }) },
      },
    },
    ...unauthorizedResponse,
    ...validationErrorResponse,
  },
});

export const registerRoute = createRoute({
  tags: ['User and Authentication'],
  method: 'post',
  path: '/users',
  description: 'Register a new user',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ user: registerUserSchema }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'User registered successfully',
      content: {
        'application/json': { schema: z.object({ user: userSchema }) },
      },
    },
    ...validationErrorResponse,
  },
});

export const getCurrentUserRoute = createRoute({
  tags: ['User and Authentication'],
  method: 'get',
  path: '/user',
  description: 'Gets the currently logged-in user',
  security: defaultRouteSecurity,
  responses: {
    200: {
      description: 'Current user retrieved successfully',
      content: {
        'application/json': { schema: z.object({ user: userSchema }) },
      },
    },
    ...unauthorizedResponse,
  },
});

export const updateUserRoute = createRoute({
  tags: ['User and Authentication'],
  method: 'put',
  path: '/user',
  description: 'Updated user information for current user',
  security: defaultRouteSecurity,
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ user: updateUserSchema }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'User updated successfully',
      content: {
        'application/json': { schema: z.object({ user: userSchema }) },
      },
    },
    ...unauthorizedResponse,
    ...validationErrorResponse,
  },
});
