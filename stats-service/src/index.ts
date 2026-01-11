import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import statsRoutes from './routes/stats.routes';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3016;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'stats-service', timestamp: new Date().toISOString() });
});

app.use('/api/v1/stats', statsRoutes);

app.listen(PORT, () => logger.info(`Stats Service on port ${PORT}`));
export default app;

