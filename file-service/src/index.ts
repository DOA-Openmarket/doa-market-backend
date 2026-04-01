import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import fileRoutes from './routes/file.routes';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3015;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'file-service', timestamp: new Date().toISOString() });
});

// attachments 경로로 변경 (API Gateway와 매칭)
app.use('/api/v1/attachments', fileRoutes);
app.use('/api/v1/files', fileRoutes); // 하위 호환성 유지

app.listen(PORT, () => logger.info(`File Service on port ${PORT}`));
export default app;

