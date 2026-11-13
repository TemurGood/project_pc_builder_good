require('./env');
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const BUCKET_NAME = process.env.NEON_STORAGE_BUCKET || 'assets';

// Per neon-object-storage skill:
// Neon reads AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_ENDPOINT_URL_S3, AWS_REGION
// from environment automatically, and requires forcePathStyle: true.
const s3 = new S3Client({
  forcePathStyle: true,
  region: process.env.AWS_REGION || 'us-east-2',
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      : undefined
});

/**
 * Upload a file buffer (receipt image/PDF or product image) to Neon Object Storage
 */
async function uploadToNeonStorage(key, buffer, contentType = 'application/octet-stream') {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType
    })
  );
  return {
    bucket: BUCKET_NAME,
    key,
    contentType
  };
}

/**
 * Generate a presigned GET URL for a stored object key (valid for 1 hour by default)
 */
async function getPresignedObjectUrl(key, expiresIn = 3600) {
  if (!key) return null;
  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    }),
    { expiresIn }
  );
  return url;
}

/**
 * Download an object from Neon Object Storage as a Buffer + ContentType
 */
async function downloadFromNeonStorage(key) {
  const res = await s3.send(
    new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    })
  );
  const byteArray = await res.Body.transformToByteArray();
  return {
    buffer: Buffer.from(byteArray),
    contentType: res.ContentType || 'application/octet-stream',
    contentLength: res.ContentLength
  };
}

/**
 * Verify connectivity to Neon Object Storage bucket
 */
async function checkStorageHealth() {
  const res = await s3.send(
    new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: 5
    })
  );
  return {
    ok: true,
    bucket: BUCKET_NAME,
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    region: process.env.AWS_REGION,
    objectCount: res.KeyCount || 0
  };
}

module.exports = {
  s3,
  BUCKET_NAME,
  uploadToNeonStorage,
  getPresignedObjectUrl,
  downloadFromNeonStorage,
  checkStorageHealth
};

