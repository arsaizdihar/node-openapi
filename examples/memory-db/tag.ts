import { memoryStore } from './store';
import { TagDB } from './types';

export async function tagsCreate(tagNames: string[]): Promise<TagDB[]> {
  const tags: TagDB[] = [];
  
  for (const tagName of tagNames) {
    let tag = memoryStore.getTagByName(tagName);
    if (!tag) {
      tag = memoryStore.createTag(tagName);
    }
    tags.push(tag);
  }
  
  return tags;
}

export async function tagsGet(): Promise<TagDB[]> {
  return memoryStore.getAllTags();
}