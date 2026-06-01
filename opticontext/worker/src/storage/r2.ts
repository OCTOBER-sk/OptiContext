import { getEnv } from "../context";

type R2BucketName = "files" | "tts";

function getBucket(name: R2BucketName): R2Bucket {
  const env = getEnv();
  switch (name) {
    case "files":
      return env.FILES_BUCKET;
    case "tts":
      return env.TTS_BUCKET;
  }
}

export const r2 = {
  async put(
    bucket: R2BucketName,
    key: string,
    data: ArrayBuffer | ReadableStream,
    options?: R2PutOptions & {
      customMetadata?: Record<string, string>;
    },
  ): Promise<R2Object> {
    return getBucket(bucket).put(key, data, options);
  },

  async get(
    bucket: R2BucketName,
    key: string,
  ): Promise<R2ObjectBody | null> {
    return getBucket(bucket).get(key);
  },

  async delete(bucket: R2BucketName, key: string): Promise<void> {
    await getBucket(bucket).delete(key);
  },

  async list(
    bucket: R2BucketName,
    options?: R2ListOptions,
  ): Promise<R2Objects> {
    return getBucket(bucket).list(options);
  },

  /**
   * Returns a public URL for an R2 object.
   * In production, map your R2 bucket to a custom domain via Cloudflare.
   * Format: https://<bucket-custom-domain>/<key>
   */
  getPublicUrl(bucket: R2BucketName, key: string): string {
    const bucketDomain =
      bucket === "files"
        ? "files.opticontext.dev"
        : "tts.opticontext.dev";
    return `https://${bucketDomain}/${key}`;
  },
};
