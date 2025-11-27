import { getCookies, setCookie } from "$std/http/cookie.ts";

// 从环境变量获取管理员密码（同时作为 API Key）
export function getAdminPassword(): string {
  const password = Deno.env.get("ADMIN_PASSWORD");
  if (!password) {
    console.warn("⚠️  ADMIN_PASSWORD 环境变量未设置，使用默认密码 'admin'");
    return "admin";
  }
  return password;
}

// 从请求头获取 API Key (Bearer Token)
export function getApiKeyFromRequest(req: Request): string | undefined {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return undefined;

    // 支持 "Bearer <token>" 格式（OpenAI 标准）
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match) {
      return match[1];
    }

    // 也支持直接传递 token
    return authHeader;
  } catch (error) {
    console.error("Error getting API key:", error);
    return undefined;
  }
}

// 验证 API Key
export function verifyApiKey(apiKey: string): boolean {
  return apiKey === getAdminPassword();
}

// 检查 API 请求是否已认证（通过 Bearer Token）
export function isApiAuthenticated(req: Request): boolean {
  try {
    const apiKey = getApiKeyFromRequest(req);
    if (!apiKey) return false;
    return verifyApiKey(apiKey);
  } catch (error) {
    console.error("Error in API authentication:", error);
    return false;
  }
}

// 生成简单的会话令牌
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// 会话存储（内存中，重启后失效）
const sessions = new Set<string>();

// 验证密码
export function verifyPassword(password: string): boolean {
  return password === getAdminPassword();
}

// 创建会话
export function createSession(): string {
  const token = generateSessionToken();
  sessions.add(token);
  return token;
}

// 验证会话
export function isValidSession(token: string): boolean {
  return sessions.has(token);
}

// 销毁会话
export function destroySession(token: string): void {
  sessions.delete(token);
}

// 从请求中获取会话令牌
export function getSessionToken(req: Request): string | undefined {
  try {
    const cookies = getCookies(req.headers);
    return cookies.session;
  } catch (error) {
    console.error("Error getting session token:", error);
    return undefined;
  }
}

// 检查请求是否已认证（通过 Cookie）
export function isAuthenticated(req: Request): boolean {
  try {
    const token = getSessionToken(req);
    if (!token) return false;
    return isValidSession(token);
  } catch (error) {
    console.error("Error in authentication:", error);
    return false;
  }
}

// 检查请求是否已认证（支持 Cookie 或 API Key）
export function isAuthenticatedAny(req: Request): boolean {
  try {
    return isAuthenticated(req) || isApiAuthenticated(req);
  } catch (error) {
    console.error("Error in isAuthenticatedAny:", error);
    return false;
  }
}

// 设置会话 Cookie
export function setSessionCookie(headers: Headers, token: string): void {
  setCookie(headers, {
    name: "session",
    value: token,
    maxAge: 60 * 60 * 24 * 7, // 7天
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  });
}

// 清除会话 Cookie
export function clearSessionCookie(headers: Headers): void {
  setCookie(headers, {
    name: "session",
    value: "",
    maxAge: 0,
    path: "/",
  });
}

// 重定向到登录页面
export function redirectToLogin(): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: "/login" },
  });
}

// API 认证中间件：检查 Bearer Token，未通过则返回 401
export function requireApiAuth(req: Request): Response | null {
  try {
    if (!isApiAuthenticated(req)) {
      return new Response(JSON.stringify({ 
        error: {
          message: "Invalid API key. Please provide a valid API key in the Authorization header.",
          type: "invalid_request_error",
          code: "invalid_api_key"
        }
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return null;
  } catch (error) {
    console.error("Error in requireApiAuth:", error);
    return new Response(JSON.stringify({ 
      error: {
        message: "Authentication error",
        type: "server_error"
      }
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// 管理 API 认证中间件：支持 Cookie 或 Bearer Token
export function requireAuth(req: Request): Response | null {
  try {
    if (!isAuthenticatedAny(req)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return null;
  } catch (error) {
    console.error("Error in requireAuth:", error);
    return new Response(JSON.stringify({ 
      error: "Authentication error",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// 页面认证中间件：仅支持 Cookie，未登录则重定向
export function requireAuthRedirect(req: Request): Response | null {
  try {
    if (!isAuthenticated(req)) {
      return redirectToLogin();
    }
    return null;
  } catch (error) {
    console.error("Error in requireAuthRedirect:", error);
    return redirectToLogin();
  }
}
