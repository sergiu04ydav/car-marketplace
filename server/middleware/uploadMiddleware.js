/**
 * middleware/uploadMiddleware.js
 *
 * npm install multer cloudinary multer-storage-cloudinary
 *
 * .env:
 *   CLOUDINARY_CLOUD_NAME=xxx
 *   CLOUDINARY_API_KEY=xxx
 *   CLOUDINARY_API_SECRET=xxx
 */

const multer    = require('multer');
const cloudinary = require('cloudinary').v2;

// Configurare Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verificare la pornire
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.warn('[Upload] ⚠️  CLOUDINARY_CLOUD_NAME lipsește din .env!');
}

// ── Încearcă să încarci multer-storage-cloudinary ─────────────
// Dacă nu e instalat, fallback pe memStorage + upload manual
let storage;
try {
  const { CloudinaryStorage } = require('multer-storage-cloudinary');
  storage = new CloudinaryStorage({
    cloudinary,
    params: async (_req, _file) => ({
      folder:           `${process.env.APP_NAME || 'automarket'}/listings`,
      allowed_formats:  ['jpg', 'jpeg', 'png', 'webp'],
      transformation:   [{ width: 1200, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
      public_id:        `listing_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    }),
  });
  console.log('[Upload] ✅ CloudinaryStorage activ');
} catch (e) {
  // multer-storage-cloudinary nu e instalat → folosim memoryStorage + upload stream manual
  console.warn('[Upload] multer-storage-cloudinary negăsit, folosesc memoryStorage + stream upload');
  storage = multer.memoryStorage();
}

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Doar JPG, PNG și WebP sunt acceptate.'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
});

// ── Upload manual via stream (folosit doar cu memoryStorage) ───
const uploadBufferToCloudinary = (buffer, mimetype) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:          `${process.env.APP_NAME || 'automarket'}/listings`,
        transformation:  [{ width: 1200, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
        public_id:       `listing_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        resource_type:   'image',
      },
      (err, result) => (err ? reject(err) : resolve(result.secure_url)),
    );
    stream.end(buffer);
  });

/**
 * Middleware: dacă fișierele au buffer (memoryStorage),
 * le uploadăm manual pe Cloudinary și punem URL-urile în req.cloudinaryUrls.
 * Dacă au .path (CloudinaryStorage), copiăm direct.
 */
const processUploads = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  try {
    if (req.files[0].path) {
      // CloudinaryStorage a pus deja URL-ul în .path
      req.cloudinaryUrls = req.files.map((f) => f.path);
    } else if (req.files[0].buffer) {
      // memoryStorage — upload manual
      req.cloudinaryUrls = await Promise.all(
        req.files.map((f) => uploadBufferToCloudinary(f.buffer, f.mimetype)),
      );
    } else {
      req.cloudinaryUrls = [];
    }
    next();
  } catch (err) {
    console.error('[Upload] Cloudinary stream error:', err.message);
    return res.status(500).json({ success: false, message: 'Eroare la încărcarea pe Cloudinary.' });
  }
};

// ── Ștergere imagine după URL ──────────────────────────────────
const deleteCloudinaryImage = async (url) => {
  try {
    let publicId = url;
    if (url.startsWith('http')) {
      const parts = url.split('/');
      const idx   = parts.indexOf('upload');
      if (idx !== -1) {
        publicId = parts.slice(idx + 2).join('/').replace(/\.[^/.]+$/, '');
      }
    }
    return await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('[Upload] Delete error:', err.message);
    return null;
  }
};

module.exports = { upload, processUploads, cloudinary, deleteCloudinaryImage };