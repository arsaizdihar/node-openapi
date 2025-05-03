import { TagDB, tagsGet } from 'ws-db';

export async function getTags(): Promise<string[]> {
  const tags = await tagsGet();
  return tags.map((tag) => toTagView(tag));
}

function toTagView(tag: TagDB): string {
  return tag.tagName;
}
