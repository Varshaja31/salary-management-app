import type { Request, Response } from 'express';

import * as authService from '../services/auth.service.js';
import { LoginError } from '../services/auth.service.js';

const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof LoginError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const header = req.headers.authorization;
    if (!header) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = header.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'Invalid token format' });
      return;
    }

    const result = await authService.refresh(token);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof LoginError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export { login, refresh };
