import { NextRouteFactory, z } from '@node-openapi/next';
import { NextResponse } from 'next/server';
import { mainFactory } from './main';

const factory = new NextRouteFactory();

const route = NextRouteFactory.createRoute({
  method: 'post',
  path: '/api',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            message: z.string().openapi({
              example: 'Hello, world!',
            }),
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
            message: z.string(),
          }),
        },
      },
      description: 'OK',
    },
  },
});

export const { POST } = factory.handler(route, async (_, ctx) => {
  return NextResponse.json({
    message: ctx.input.json.message,
  });
}).handlers;

mainFactory.router(factory);
