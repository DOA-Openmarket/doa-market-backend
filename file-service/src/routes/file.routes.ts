import { Router } from 'express';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' });

/**
 * 타입별 첨부파일 업로드
 * POST /api/v1/attachments/upload/:type/:id
 * type: product, banner, seller, notice, guide, inquiry, error_report, review
 */
router.post('/upload/:type/:id', upload.array('files', 10), async (req, res) => {
  try {
    const { type, id } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '파일이 업로드되지 않았습니다.',
      });
    }

    // TODO: AWS S3 upload
    const uploadedFiles = files.map(file => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: `https://example.com/uploads/${file.filename}`,
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      uploadedAt: new Date().toISOString(),
    }));

    res.json({
      success: true,
      data: {
        files: uploadedFiles,
      },
      message: '파일이 업로드되었습니다.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * 타입별 첨부파일 삭제
 * POST /api/v1/attachments/delete/:type
 */
router.post('/delete/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '삭제할 파일 ID가 필요합니다.',
      });
    }

    // TODO: AWS S3 delete
    res.json({
      success: true,
      message: '파일이 삭제되었습니다.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * 첨부파일 다운로드 URL 조회
 * GET /api/v1/attachments/download-url/:key
 */
router.get('/download-url/:key', async (req, res) => {
  try {
    const { key } = req.params;

    // TODO: Presigned URL 생성 (AWS S3)
    const url = `https://example.com/downloads/${key}?expires=${Date.now() + 3600000}`;

    res.json({
      success: true,
      data: {
        url,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// 기존 엔드포인트 (하위 호환성)
router.post('/upload', upload.single('file'), async (req, res) => {
  // TODO: AWS S3 upload
  res.json({ 
    success: true, 
    data: { 
      url: 'https://example.com/file.jpg',
      message: 'S3 integration pending'
    } 
  });
});

router.delete('/:key', async (req, res) => {
  // TODO: AWS S3 delete
  res.json({ success: true, message: 'File deleted' });
});

export default router;

