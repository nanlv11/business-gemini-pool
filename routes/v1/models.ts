import { Handlers } from "$fresh/server.ts";
import { ConfigStore } from "../../lib/config-store.ts";
import { requireAuth } from "../../lib/auth.ts";

/**
 * OpenAI 兼容的模型列表接口
 * GET /v1/models
 */
export const handler: Handlers = {
  async GET(_req, _ctx) {
    // API Key 认证
    const authError = requireAuth(_req);
    if (authError) return authError;

    const kv = await Deno.openKv();
    const store = new ConfigStore(kv);

    try {
      const models = await store.listModels();

      // 转换为 OpenAI 格式
      const data = models
        .filter((m) => m.enabled !== false)
        .map((m) => ({
          id: m.id,
          object: "model",
          created: Math.floor(Date.now() / 1000),
          owned_by: "google",
          permission: [],
          root: m.id,
          parent: null,
        }));

      return Response.json({
        object: "list",
        data,
      });
    } catch (error) {
      console.error("Failed to list models:", error);
      return Response.json({ error: "Failed to list models" }, { status: 500 });
    }
  },
};
