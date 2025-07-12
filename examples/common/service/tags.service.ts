import { TagDB, tagsGet } from '../db-adapter';

export async function getTags(): Promise<string[]> {
  const tags = await tagsGet();
  return tags.map((tag) => toTagView(tag));
}

function toTagView(tag: TagDB): string {
  return tag.tagName;
}
