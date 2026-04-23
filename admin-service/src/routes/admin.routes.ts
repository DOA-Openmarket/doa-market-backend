import { Router } from 'express';
import axios from 'axios';
import Inquiry from '../models/inquiry.model';

const router = Router();

router.get('/dashboard', async (req, res) => {
  const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3005';
  const SELLER_SERVICE_URL = process.env.SELLER_SERVICE_URL || 'http://seller-service:3011';
  const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3003';
  const authHeader = req.headers.authorization;

  let totalUsers = 0;
  let totalSellers = 0;
  let totalOrders = 0;
  let totalSales = 0;
  let allOrders: any[] = [];

  try {
    const r = await axios.get(`${USER_SERVICE_URL}/api/v1/users/stats`, {
      headers: { Authorization: authHeader },
    });
    const stats = r.data?.data || r.data;
    totalUsers = stats?.byRole?.user ?? stats?.totalUsers ?? 0;
  } catch {}

  try {
    const r = await axios.get(`${SELLER_SERVICE_URL}/api/v1/sellers?limit=1000`, {
      headers: { Authorization: authHeader },
    });
    totalSellers = (r.data?.data || []).length;
  } catch {}

  try {
    const r = await axios.get(`${ORDER_SERVICE_URL}/api/v1/orders`, {
      headers: { Authorization: authHeader },
    });
    allOrders = r.data?.data || [];
    totalOrders = allOrders.length;
    totalSales = allOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
  } catch {}

  let recentInquiries: any[] = [];
  try {
    const inquiries = await Inquiry.findAll({ order: [['createdAt', 'DESC']], limit: 10 });
    recentInquiries = inquiries.map((i) => i.toJSON());
  } catch {}

  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  const monthlyData = (year: number) =>
    Array(12).fill(null).map((_, month) => {
      const monthOrders = allOrders.filter((o: any) => {
        const d = new Date(o.createdAt);
        return d.getFullYear() === year && d.getMonth() === month;
      });
      return {
        revenue: monthOrders.reduce((s: number, o: any) => s + parseFloat(o.totalAmount || 0), 0),
        orders: monthOrders.length,
      };
    });

  // Last 6 months order/revenue trends
  const now = new Date();
  const trendsOrders = Array(6).fill(0);
  const trendsRevenue = Array(6).fill(0);
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthOrders = allOrders.filter((o: any) => {
      const d = new Date(o.createdAt);
      return d >= start && d < end;
    });
    trendsOrders[5 - i] = monthOrders.length;
    trendsRevenue[5 - i] = Math.round(
      monthOrders.reduce((s: number, o: any) => s + parseFloat(o.totalAmount || 0), 0)
    );
  }

  res.json({
    success: true,
    data: {
      totalUsers,
      totalSellers,
      totalOrders,
      totalSales: Math.round(totalSales),
      trends: {
        users: [0, 0, 0, 0, 0, 0],
        sellers: [0, 0, 0, 0, 0, 0],
        orders: trendsOrders,
        revenue: trendsRevenue,
      },
      recentInquiries,
      yearlyRevenue: {
        currentYear,
        lastYear,
        thisYearData: monthlyData(currentYear),
        lastYearData: monthlyData(lastYear),
      },
      weeklyRevenue: [],
      dailyRevenue: [],
    },
  });
});

router.get('/users', async (req, res) => {
  try {
    const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3005';
    const REVIEW_SERVICE_URL = process.env.REVIEW_SERVICE_URL || 'http://review-service:3007';
    const { search, page, limit, status } = req.query;
    const query = new URLSearchParams();

    // Filter for regular users only (not sellers or admins)
    query.append('role', 'user');

    if (search) query.append('search', search as string);
    if (page) query.append('page', page as string);
    // Use high limit to return all users (frontend does client-side pagination)
    query.append('limit', (limit as string) || '1000');
    if (status) query.append('status', status as string);

    const response = await axios.get(`${USER_SERVICE_URL}/api/v1/users?${query.toString()}`, {
      headers: { Authorization: req.headers.authorization }
    });

    const users: any[] = response.data?.data || [];

    // Enrich with review counts
    const enriched = await Promise.all(
      users.map(async (user: any) => {
        let review_cnt = 0;
        try {
          const rr = await axios.get(`${REVIEW_SERVICE_URL}/api/v1/reviews?userId=${user.id}&limit=1`, {
            headers: { Authorization: req.headers.authorization },
          });
          review_cnt = Array.isArray(rr.data?.data) ? rr.data.data.length : 0;
        } catch {}
        return { ...user, review_cnt };
      })
    );

    res.json({ ...response.data, data: enriched });
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: { message: error.response?.data?.error?.message || 'Failed to fetch users' }
    });
  }
});

router.get('/sellers', async (req, res) => {
  try {
    const SELLER_SERVICE_URL = process.env.SELLER_SERVICE_URL || 'http://seller-service:3011';
    const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3005';
    const { search, page, limit, status, userId } = req.query;
    const query = new URLSearchParams();

    if (search) query.append('search', search as string);
    if (page) query.append('page', page as string);
    if (limit) query.append('limit', limit as string);
    if (status) query.append('status', status as string);
    if (userId) query.append('userId', userId as string);

    // Get sellers from seller-service
    const sellersResponse = await axios.get(`${SELLER_SERVICE_URL}/api/v1/sellers?${query.toString()}`, {
      headers: {
        Authorization: req.headers.authorization
      }
    });

    const sellers = sellersResponse.data.data || [];

    // Enrich sellers with user information
    const enrichedSellers = await Promise.all(
      sellers.map(async (seller: any) => {
        try {
          // Fetch user info for each seller
          const userResponse = await axios.get(`${USER_SERVICE_URL}/api/v1/users/${seller.userId}`, {
            headers: {
              Authorization: req.headers.authorization
            }
          });

          const user = userResponse.data.data || {};

          // Combine seller and user data in the format frontend expects
          return {
            id: seller.id,
            userId: seller.userId,
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            shop_name: seller.storeName,
            business_number: seller.businessNumber,
            status: seller.status,
            verifiedAt: seller.verifiedAt,
            createdAt: seller.createdAt,
            updatedAt: seller.updatedAt,
          };
        } catch (error) {
          console.error(`Failed to fetch user for seller ${seller.id}:`, error);
          // Return seller data without user info if user fetch fails
          return {
            id: seller.id,
            userId: seller.userId,
            name: '',
            email: '',
            phone: '',
            shop_name: seller.storeName,
            business_number: seller.businessNumber,
            status: seller.status,
            verifiedAt: seller.verifiedAt,
            createdAt: seller.createdAt,
            updatedAt: seller.updatedAt,
          };
        }
      })
    );

    res.json({
      success: true,
      data: enrichedSellers,
      total: enrichedSellers.length,
    });
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: { message: error.response?.data?.error?.message || 'Failed to fetch sellers' }
    });
  }
});

router.get('/sellers/:id', async (req, res) => {
  try {
    const SELLER_SERVICE_URL = process.env.SELLER_SERVICE_URL || 'http://seller-service:3011';
    const response = await axios.get(`${SELLER_SERVICE_URL}/api/v1/sellers/${req.params.id}`, {
      headers: {
        Authorization: req.headers.authorization
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: { message: error.response?.data?.error?.message || 'Failed to fetch seller' }
    });
  }
});

router.patch('/sellers/:id/status', async (req, res) => {
  try {
    const SELLER_SERVICE_URL = process.env.SELLER_SERVICE_URL || 'http://seller-service:3011';
    const { status } = req.body;

    // Update seller status (pending, verified, rejected, suspended)
    const response = await axios.put(`${SELLER_SERVICE_URL}/api/v1/sellers/${req.params.id}`,
      { status },
      {
        headers: {
          Authorization: req.headers.authorization,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: { message: error.response?.data?.error?.message || 'Failed to update seller status' }
    });
  }
});

router.patch('/sellers/:id/verify', async (req, res) => {
  try {
    const SELLER_SERVICE_URL = process.env.SELLER_SERVICE_URL || 'http://seller-service:3011';
    const response = await axios.patch(`${SELLER_SERVICE_URL}/api/v1/sellers/${req.params.id}/verify`, {},
      {
        headers: {
          Authorization: req.headers.authorization
        }
      }
    );
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: { message: error.response?.data?.error?.message || 'Failed to verify seller' }
    });
  }
});

router.delete('/sellers/:id', async (req, res) => {
  try {
    const SELLER_SERVICE_URL = process.env.SELLER_SERVICE_URL || 'http://seller-service:3011';
    const response = await axios.delete(`${SELLER_SERVICE_URL}/api/v1/sellers/${req.params.id}`, {
      headers: {
        Authorization: req.headers.authorization
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: { message: error.response?.data?.error?.message || 'Failed to delete seller' }
    });
  }
});

router.post('/users/:id/suspend', async (req, res) => {
  // Call User Service to suspend user
  res.json({ success: true, message: 'User suspended' });
});

router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3005';

    // Call User Service to delete user
    const response = await axios.delete(`${USER_SERVICE_URL}/api/v1/users/${userId}`, {
      headers: {
        Authorization: req.headers.authorization
      }
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: { message: error.response?.data?.error?.message || 'Failed to delete user' }
    });
  }
});

export default router;

