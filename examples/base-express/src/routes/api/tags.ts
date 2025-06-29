import { Router } from 'express';
import getTagsController from '../../controllers/tagsController/getTags';

const router = Router();

router.get('/', getTagsController);

export default router;
