import { Router } from 'express';

import * as chatController from '../../controllers/chat.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { checkPermission } from '../../middlewares/permission.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { chatQuestionSchema } from '../../validations/chat.validation.js';

const chatRouter = Router();

chatRouter.post(
  '/',
  validate(chatQuestionSchema),
  authMiddleware,
  checkPermission(['DASHBOARD_VIEW']),
  chatController.ask,
);

export default chatRouter;
