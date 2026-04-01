import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.substring(7);
    if (!token) throw new Error();

    // Use service name for Kubernetes, fallback to localhost for local development
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
    const response = await axios.get(`${authServiceUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    (req as any).user = response.data.data;
    next();
  } catch {
    res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
  }
};

