import User from '../models/user.model';
import { AppError } from '../utils/app-error';

export class UserService {
  async getUsers(page = 1, limit = 20, filters?: any) {
    const offset = (page - 1) * limit;
    const where: any = {};
    
    if (filters?.status) where.status = filters.status;
    if (filters?.role) where.role = filters.role;

    const { count, rows } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      users: rows,
      meta: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getUserById(id: string) {
    const user = await User.findByPk(id);
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async updateUser(id: string, data: Partial<User>) {
    const user = await this.getUserById(id);
    await user.update(data);
    return user;
  }

  async deleteUser(id: string) {
    const user = await this.getUserById(id);
    await user.update({ status: 'deleted' });
  }

  async createUser(data: Partial<User>) {
    const user = await User.create(data as any);
    return user;
  }

  async getUserStats() {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { status: 'active' } });
    const inactiveUsers = await User.count({ where: { status: 'inactive' } });
    const deletedUsers = await User.count({ where: { status: 'deleted' } });

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      deletedUsers,
      byRole: {
        user: await User.count({ where: { role: 'user' } }),
        admin: await User.count({ where: { role: 'admin' } }),
      },
    };
  }
}

export default new UserService();

