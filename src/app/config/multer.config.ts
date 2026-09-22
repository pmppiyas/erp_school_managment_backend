import multer, { StorageEngine } from 'multer';
import { Request } from 'express';
import { cloudinary } from './cloudinary.config';

class CloudinaryCustomStorage implements StorageEngine {
  _handleFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error?: any, info?: Partial<Express.Multer.File>) => void
  ): void {
    const fileName = file.originalname
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/\./g, '_')
      .replace(/[^a-z0-9_]/gi, '');

    const uniqueFileName = `${Math.random().toString(36).substring(2)}-${Date.now()}-${fileName}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'school',
        public_id: uniqueFileName,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          return cb(error);
        }
        if (!result) {
          return cb(new Error('Cloudinary upload returned undefined result'));
        }
        cb(null, {
          path: result.secure_url,
          filename: result.public_id,
        });
      }
    );

    file.stream.pipe(uploadStream);
  }

  _removeFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null) => void
  ): void {
    if (file.filename) {
      cloudinary.uploader.destroy(file.filename, (err) => {
        cb(err || null);
      });
    } else {
      cb(null);
    }
  }
}

const storage = new CloudinaryCustomStorage();

export const multerUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

