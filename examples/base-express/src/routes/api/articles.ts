import { Router } from 'express';
import articlesCreateController from '../../controllers/articlesController/articlesCreate';
import articlesGetController from '../../controllers/articlesController/articlesGet';
import articlesListController from '../../controllers/articlesController/articlesList';
import articlesFeedController from '../../controllers/articlesController/articlesFeed';
import articlesFavoriteController from '../../controllers/articlesController/articlesFavorite';
import articlesUnFavoriteController from '../../controllers/articlesController/articlesUnFavorite';
import articlesUpdateController from '../../controllers/articlesController/articlesUpdate';
import articlesDeleteController from '../../controllers/articlesController/articlesDelete';
import createCommentController from '../../controllers/commentsController/createComment';
import getCommentsController from '../../controllers/commentsController/getComments';
import deleteCommentController from '../../controllers/commentsController/deleteComment';
import * as auth from '../../middleware/auth/authenticator';

const router = Router();

router.get('/', auth.optionalAuthenticate, articlesListController);

router.get('/feed', auth.authenticate, articlesFeedController);

router.get('/:slug', auth.optionalAuthenticate, articlesGetController);

router.post('/', auth.authenticate, articlesCreateController);

router.put('/:slug', auth.authenticate, articlesUpdateController);

router.delete('/:slug', auth.authenticate, articlesDeleteController);

router.post('/:slug/comments', auth.authenticate, createCommentController);

router.get('/:slug/comments', auth.optionalAuthenticate, getCommentsController);

router.delete(
  '/:slug/comments/:id',
  auth.authenticate,
  deleteCommentController,
);

router.post('/:slug/favorite', auth.authenticate, articlesFavoriteController);

router.delete(
  '/:slug/favorite',
  auth.authenticate,
  articlesUnFavoriteController,
);

export default router;
