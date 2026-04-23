import { Request, Response, NextFunction } from 'express';
import userService from '../services/user.service';

export class UserController {
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await userService.getUsers(page, limit, req.query);
      res.json({ success: true, data: result.users, meta: result.meta });
    } catch (error) {
      next(error);
    }
  }

  async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id || req.params.userId;
      const user = await userService.getUserById(id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id || req.params.userId;
      const user = await userService.updateUser(id, req.body);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      await userService.deleteUser(req.params.id);
      res.json({ success: true, message: 'User deleted' });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.createUser(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await userService.getUserStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async restoreUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.restoreUser(req.params.id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async findByEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.query as { email: string };
      if (!email) {
        return res.status(400).json({ success: false, message: 'email query param required' });
      }
      const user = await userService.findByEmail(email);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();

