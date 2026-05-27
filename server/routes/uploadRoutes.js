/**
 * routes/uploadRoutes.js
 *
 * POST   /api/upload/images
 * DELETE /api/upload/image
 */

const express = require('express');
const router  = express.Router();
const { protect }                              = require('../middleware/authMiddleware');
const { upload, processUploads, deleteCloudinaryImage } = require('../middleware/uploadMiddleware');

router.post(
  '/images',
  protect,
  // 1. Multer parsează multipart și pune fișierele în req.files
  (req, res, next) => {
    upload.array('images', 10)(req, res, (err) => {
      if (err) {
        console.error('[Upload] Multer error:', err.message);
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  // 2. Dacă e memoryStorage, uploadăm stream pe Cloudinary
  processUploads,
  // 3. Răspuns final
  (req, res) => {
    const urls = req.cloudinaryUrls || req.files?.map((f) => f.path || f.secure_url) || [];

    if (!urls.length) {
      return res.status(400).json({
        success: false,
        message: 'Nicio imagine primită. Field name trebuie să fie "images".',
      });
    }

    console.log(`[Upload] ✅ ${urls.length} imagine(i) de la user ${req.user?.id}`);
    return res.json({ success: true, urls });
  },
);

router.delete('/image', protect, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, message: 'URL lipsă.' });
  await deleteCloudinaryImage(url);
  return res.json({ success: true });
});

module.exports = router;