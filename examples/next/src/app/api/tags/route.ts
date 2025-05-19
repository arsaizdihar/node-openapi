import { NextResponse } from 'next/server';
import { getTags } from 'ws-common/service/tags.service';
import { tagsFactory } from './factory';

tagsFactory.handler('GET', async () => {
  const tags = await getTags();
  return NextResponse.json({ tags });
});

export const { GET } = tagsFactory.handlers;
