import { Router } from 'express';
import userGetController from '../../controllers/userController/userGet';
import userUpdateController from '../../controllers/userController/userUpdate';
import { authenticate } from '../../middleware/auth/authenticator';

const router = Router();

router.get('/', authenticate, userGetController);

router.put('/', authenticate, userUpdateController);

export default router;
