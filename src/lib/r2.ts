import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/* ── Config ───────────────────────────────────────── */

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const BUCKET = process.env.R2_BUCKET_NAME || "beiradocampo";
const PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

/* ── Upload ───────────────────────────────────────── */

/**
 * Faz upload de um buffer (imagem) para o Cloudflare R2.
 * Retorna a URL pública da imagem.
 *
 * @param key   - Caminho no bucket, ex: "articles/meu-artigo.png"
 * @param body  - Buffer com os bytes da imagem
 * @param contentType - MIME type, ex: "image/png"
 */
export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType = "image/png"
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return `${PUBLIC_URL}/${key}`;
}
