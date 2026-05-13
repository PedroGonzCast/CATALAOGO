import { S3Client } from '@aws-sdk/client-s3';

export const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  // Path-style obligatorio para buckets con puntos en el nombre (SSL virtual-hosted no soporta multi-dots)
  forcePathStyle: true,
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET!;

// Formato path-style: https://s3.<region>.amazonaws.com/<bucket>/<key>
export function buildS3Url(key: string): string {
  return `https://s3.${process.env.AWS_REGION}.amazonaws.com/${S3_BUCKET}/${key}`;
}
