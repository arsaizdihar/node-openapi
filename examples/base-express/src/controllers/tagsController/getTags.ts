import { Request, Response } from 'express';
import { getTags } from 'ws-common/service/tags.service';

/**
 * Tags controller that responds with a list of all the tags on the system.
 * @param _req
 * @param res
 * @returns
 */
export default async function getTagsController(_req: Request, res: Response) {
  const tags = await getTags();
  res.json({ tags });
}
