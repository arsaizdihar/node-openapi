import { NextRouteFactory } from '@node-openapi/next';
import { getTagsRoute } from '../routes/tags.routes';
import { getTags } from 'ws-common/service/tags.service';
import { NextResponse } from 'next/server';

export const tagsController = new NextRouteFactory();

tagsController.route(getTagsRoute, async () => {
  const tags = await getTags();

  return NextResponse.json({ tags });
});
