const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');

const TYPES = {
  'image/jpeg': { extensions: ['.jpg', '.jpeg'], maxSize: 10 * 1024 * 1024 },
  'image/png': { extensions: ['.png'], maxSize: 10 * 1024 * 1024 },
  'image/webp': { extensions: ['.webp'], maxSize: 10 * 1024 * 1024 },
  'video/mp4': { extensions: ['.mp4'], maxSize: 100 * 1024 * 1024 },
  'video/webm': { extensions: ['.webm'], maxSize: 100 * 1024 * 1024 }
};
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/webm'];
const MEDIA_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES];
const uploadDir = path.join(__dirname, '..', 'uploads');

function signatureMatches(buffer, mime) {
  if (mime === 'image/jpeg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === 'image/webp') return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  if (mime === 'video/mp4') return buffer.toString('ascii', 4, 8) === 'ftyp';
  if (mime === 'video/webm') return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  return false;
}

function safeUpload({ fields, maxFiles = 1, maxTotalSize = 10 * 1024 * 1024 }) {
  const fieldTypes = new Map(Object.entries(fields));
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      cb(null, `${crypto.randomUUID()}${ext}`);
    }
  });
  const parser = multer({
    storage,
    limits: { fileSize: maxTotalSize, files: maxFiles * fieldTypes.size, fields: 50, parts: maxFiles * fieldTypes.size + 50 },
    fileFilter(_req, file, cb) {
      const types = fieldTypes.get(file.fieldname) || [];
      const spec = TYPES[file.mimetype];
      const ext = path.extname(file.originalname || '').toLowerCase();
      if (!spec || !types.includes(file.mimetype) || !spec.extensions.includes(ext)) return cb(new Error('Type de fichier non autorisé. Formats acceptés : JPEG, PNG, WebP et MP4/WebM selon le champ.'));
      cb(null, true);
    }
  });

  const parse = (req, res, next) => parser.fields([...fieldTypes.keys()].map(name => ({ name, maxCount: maxFiles })))(req, res, async (error) => {
    if (error) {
      const partial = Object.values(req.files || {}).flat();
      await Promise.all(partial.map(file => fs.unlink(file.path).catch(() => {})));
      return next(error);
    }
    const files = Object.values(req.files || {}).flat();
    try {
      for (const file of files) {
        const allowed = fieldTypes.get(file.fieldname) || [];
        const stat = await fs.stat(file.path);
        const spec = TYPES[file.mimetype];
        const handle = await fs.open(file.path, 'r');
        const header = Buffer.alloc(16);
        const { bytesRead } = await handle.read(header, 0, header.length, 0);
        await handle.close();
        if (!allowed.includes(file.mimetype) || stat.size > spec.maxSize || !signatureMatches(header.subarray(0, bytesRead), file.mimetype)) {
          await fs.unlink(file.path).catch(() => {});
          for (const other of files) if (other.path !== file.path) await fs.unlink(other.path).catch(() => {});
          return next(new Error('Le contenu réel du fichier ne correspond pas à un type autorisé ou dépasse la taille permise.'));
        }
      }
      if (files.length) req.file = files[0];
      return next();
    } catch (verifyError) {
      await Promise.all(files.map(file => fs.unlink(file.path).catch(() => {})));
      return next(verifyError);
    }
  });
  return parse;
}

module.exports = { safeUpload, IMAGE_TYPES, VIDEO_TYPES, MEDIA_TYPES };
