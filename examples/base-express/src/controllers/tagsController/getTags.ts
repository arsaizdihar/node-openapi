import { Request, Response } from 'express';
import { tagsGet } from 'ws-db';
import tagViewer from '../../view/tagViewer';

/**
 * Tags controller that responds with a list of all the tags on the system.
 * @param _req
 * @param res
 * @returns
 */
export default async function getTags(_req: Request, res: Response) {
  // Get all the tags
  const tags = await tagsGet();

  // Create the tags view
  const tagsView = tags.map((tag) => tagViewer(tag));

  res.json({ tags: tagsView });
}
