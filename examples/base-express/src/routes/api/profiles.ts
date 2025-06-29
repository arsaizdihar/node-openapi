import { Router } from 'express';
import getProfileController from '../../controllers/profileController/getProfile';
import followProfileController from '../../controllers/profileController/followProfile';
import unfollowProfileController from '../../controllers/profileController/unFollowProfile';
import * as auth from '../../middleware/auth/authenticator';

const router = Router();

router.get('/:username', auth.optionalAuthenticate, getProfileController);

router.post('/:username/follow', auth.authenticate, followProfileController);

router.delete(
  '/:username/follow',
  auth.authenticate,
  unfollowProfileController,
);

export default router;
