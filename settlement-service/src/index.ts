import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import settlementRoutes from './routes/settlement.routes';
import { sequelize } from './config/database';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3008;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'settlement-service', timestamp: new Date().toISOString() });
});

app.use('/api/v1/settlements', settlementRoutes);

const startServer = async () => {
  await sequelize.sync({ alter: true });
  app.listen(PORT, () => logger.info(`Settlement Service on port ${PORT}`));
};

startServer();
export default app;

