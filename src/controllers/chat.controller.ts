import type { Request, Response } from 'express';

import { logger } from '../logger/logger.js';
import * as chatService from '../services/chat/chat.service.js';
import { ChatError } from '../services/chat/chat.errors.js';

const ask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { question } = req.body;
    const result = await chatService.askQuestion(question);
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof ChatError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    logger.error({ err: error }, 'Chat request failed');
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export { ask };
