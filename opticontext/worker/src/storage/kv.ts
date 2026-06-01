import { getEnv } from "../context";

const KV_NAMESPACES = ["API_KEYS", "RATE_LIMITS", "CACHE"] as const;
type KVNamespaceName = (typeof KV_NAMESPACES)[number];

function getNamespace(name: KVNamespaceName): KVNamespace {
  const env = getEnv();
  switch (name) {
    case "API_KEYS":
      return env.API_KEYS;
    case "RATE_LIMITS":
      return env.RATE_LIMITS;
    case "CACHE":
      return env.CACHE;
  }
}

export const kv = {
  async get(
    namespace: KVNamespaceName,
    key: string,
  ): Promise<string | null> {
    return getNamespace(namespace).get(key);
  },

  async getJson<T>(
    namespace: KVNamespaceName,
    key: string,
  ): Promise<T | null> {
    return getNamespace(namespace).get(key, "json") as Promise<T | null>;
  },

  async put(
    namespace: KVNamespaceName,
    key: string,
    value: string | ArrayBuffer | ArrayBufferView,
    options?: { expirationTtl?: number; metadata?: Record<string, unknown> },
  ): Promise<void> {
    await getNamespace(namespace).put(key, value, options);
  },

  async putJson(
    namespace: KVNamespaceName,
    key: string,
    value: unknown,
    options?: { expirationTtl?: number },
  ): Promise<void> {
    await getNamespace(namespace).put(key, JSON.stringify(value), options);
  },

  async delete(
    namespace: KVNamespaceName,
    key: string,
  ): Promise<void> {
    await getNamespace(namespace).delete(key);
  },

  async list(
    namespace: KVNamespaceName,
    options?: { prefix?: string; limit?: number },
  ) {
    return getNamespace(namespace).list(options);
  },

  async increment(
    namespace: KVNamespaceName,
    key: string,
    ttl: number = 60,
  ): Promise<number> {
    if (!key) throw new Error("kv.increment requires a non-empty key");
    const val = await getNamespace(namespace).get(key);
    const count = val ? parseInt(val, 10) : 0;
    const safeCount = isNaN(count) ? 0 : count;
    const newCount = safeCount + 1;
    await getNamespace(namespace).put(key, newCount.toString(), {
      expirationTtl: ttl,
    });
    return newCount;
  },
};
