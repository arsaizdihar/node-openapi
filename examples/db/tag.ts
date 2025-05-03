import prisma from './prisma';

export async function tagsCreate(tags: Array<string>) {
  const createdTags = [];
  for (const tag of tags) {
    createdTags.push(
      await prisma.tag.upsert({
        create: { tagName: tag },
        where: { tagName: tag },
        update: {},
      }),
    );
  }
  return createdTags;
}

export async function tagsGet() {
  const tags = await prisma.tag.findMany({
    select: { tagName: true },
  });
  return tags;
}
