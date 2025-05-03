import prisma from './prisma';

export async function tagsCreate(tags: Array<string>) {
  const existingTags = await prisma.tag.findMany({
    where: {
      tagName: {
        in: tags,
      },
    },
  });
  await prisma.tag.createMany({
    data: tags
      .filter((tag) => !existingTags.some((t) => t.tagName === tag))
      .map((tag) => ({ tagName: tag })),
  });

  return tags.map((tag) => ({ tagName: tag }));
}

export async function tagsGet() {
  const tags = await prisma.tag.findMany({
    select: { tagName: true },
  });
  return tags;
}
