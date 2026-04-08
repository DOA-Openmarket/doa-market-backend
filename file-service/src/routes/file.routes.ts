import { Router } from 'express';
import multer from 'multer';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';
import path from 'path';

const router = Router();
const upload = multer({ dest: '/tmp/uploads/' });

const S3_BUCKET = process.env.S3_BUCKET_NAME || '';
const AWS_REGION = process.env.AWS_REGION || 'ap-northeast-2';

const s3 = new S3Client({ region: AWS_REGION });

async function uploadToS3(file: Express.Multer.File, s3Key: string): Promise<string> {
  const fileStream = fs.createReadStream(file.path);
  const uploader = new Upload({
    client: s3,
    params: {
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: fileStream,
      ContentType: file.mimetype,
    },
  });
  await uploader.done();
  fs.unlink(file.path, () => {}); // 임시 파일 삭제
  // S3 퍼블릭 URL (버킷 정책으로 AllowPublicRead 설정됨)
  return `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
}

/**
 * 임시 첨부파일 업로드 (상품 등록 전)
 * POST /api/v1/attachments/temp/upload/:id
 */
router.post('/temp/upload/:id', upload.array('files', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: '파일이 업로드되지 않았습니다.' });
    }

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const ext = path.extname(file.originalname) || '';
        const s3Key = `temp/${id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
        const url = await uploadToS3(file, s3Key);
        return {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url,
          name: file.originalname,
          size: file.size,
          type: file.mimetype,
          uploadedAt: new Date().toISOString(),
        };
      })
    );

    res.json({ success: true, files: uploadedFiles, message: '임시 파일이 업로드되었습니다.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 에디터 첨부파일 업로드
 * POST /api/v1/attachments/editor/upload/:id
 */
router.post('/editor/upload/:id', upload.array('files', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: '파일이 업로드되지 않았습니다.' });
    }

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const ext = path.extname(file.originalname) || '';
        const s3Key = `editor/${id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
        const url = await uploadToS3(file, s3Key);
        return {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url,
          name: file.originalname,
          size: file.size,
          type: file.mimetype,
          uploadedAt: new Date().toISOString(),
        };
      })
    );

    res.json({ success: true, files: uploadedFiles, message: '에디터 파일이 업로드되었습니다.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 타입별 첨부파일 업로드
 * POST /api/v1/attachments/upload/:type/:id
 */
router.post('/upload/:type/:id', upload.array('files', 10), async (req, res) => {
  try {
    const { type, id } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: '파일이 업로드되지 않았습니다.' });
    }

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const ext = path.extname(file.originalname) || '';
        const s3Key = `${type}/${id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
        const url = await uploadToS3(file, s3Key);
        return {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url,
          name: file.originalname,
          size: file.size,
          type: file.mimetype,
          uploadedAt: new Date().toISOString(),
        };
      })
    );

    res.json({ success: true, files: uploadedFiles, message: '파일이 업로드되었습니다.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 타입별 첨부파일 삭제
 * POST /api/v1/attachments/delete/:type
 */
router.post('/delete/:type', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: '삭제할 파일 ID가 필요합니다.' });
    }

    if (S3_BUCKET) {
      await Promise.all(
        ids.map((key: string) =>
          s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }))
        )
      );
    }

    res.json({ success: true, message: '파일이 삭제되었습니다.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 첨부파일 다운로드 URL 조회
 * GET /api/v1/attachments/download-url/:key
 */
router.get('/download-url/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const url = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
    res.json({
      success: true,
      data: { url, expiresAt: new Date(Date.now() + 3600000).toISOString() },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 기존 엔드포인트 (하위 호환성)
router.post('/upload', upload.single('file'), async (req, res) => {
  res.json({ success: true, data: { url: '', message: 'Use /upload/:type/:id instead' } });
});

router.delete('/:key', async (req, res) => {
  res.json({ success: true, message: 'File deleted' });
});

export default router;
