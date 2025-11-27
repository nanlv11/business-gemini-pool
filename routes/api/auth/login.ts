import { Handlers } from "$fresh/server.ts";
import { verifyPassword, createSession, setSessionCookie } from "../../../lib/auth.ts";

export const handler: Handlers = {
  async POST(req, _ctx) {
    try {
      const formData = await req.formData();
      const password = formData.get("password")?.toString();

      if (!password) {
        return new Response(null, {
          status: 302,
          headers: { Location: "/login?error=missing_password" },
        });
      }

      if (!verifyPassword(password)) {
        return new Response(null, {
          status: 302,
          headers: { Location: "/login?error=invalid_password" },
        });
      }

      // 创建会话
      const sessionToken = createSession();

      // 设置 Cookie 并重定向到首页
      const headers = new Headers({ Location: "/" });
      setSessionCookie(headers, sessionToken);

      return new Response(null, {
        status: 302,
        headers,
      });
    } catch (error) {
      console.error("Login error:", error);
      return new Response(null, {
        status: 302,
        headers: { Location: "/login?error=server_error" },
      });
    }
  },
};
