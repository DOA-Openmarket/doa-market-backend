import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.substring(7);
    if (!token) throw new Error();
    
    const response = await axios.get('http://localhost:3001/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    (req as any).user = response.data.data;
    next();
  } catch {
    res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
  }
};

