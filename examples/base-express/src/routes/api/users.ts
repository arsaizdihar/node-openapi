import { Router } from 'express';
import usersLoginController from '../../controllers/usersController/usersLogin';
import usersRegisterController from '../../controllers/usersController/usersRegister';

const router = Router();

router.post('/login', usersLoginController);

router.post('/', usersRegisterController);

export default router;
