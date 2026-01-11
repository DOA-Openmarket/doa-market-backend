import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: { message: 'No token provided' } });
    }

    // Verify token with auth service
    const token = authHeader.substring(7);
    const response = await axios.get(`${AUTH_SERVICE_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    (req as any).user = response.data.data;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: { message: 'Invalid token' } });
  }
};

