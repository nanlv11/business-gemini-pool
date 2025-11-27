# Cookie 认证修复说明

## 问题原因

添加账号失败是因为浏览器的 `fetch` API 默认不会自动发送 Cookie，需要显式设置 `credentials: 'include'`。

## 已修复内容

### 1. AccountManager 组件 (islands/AccountManager.tsx)

所有 API 调用都添加了 `credentials: "include"`：

```typescript
// ✅ 列出账号
await fetch("/api/accounts", { credentials: "include" })

// ✅ 删除账号  
await fetch(`/api/accounts/${id}`, { method: "DELETE", credentials: "include" })

// ✅ 切换账号状态
await fetch(`/api/accounts/${id}/toggle`, { method: "POST", credentials: "include" })

// ✅ 测试账号
await fetch(`/api/accounts/${id}/test`, { method: "POST", credentials: "include" })

// ✅ 添加账号
await fetch("/api/accounts", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(account)
})
```

### 2. ChatInterface 组件 (islands/ChatInterface.tsx)

聊天 API 调用添加了 Cookie 支持：

```typescript
// ✅ 流式聊天
await fetch("/v1/chat/completions", {
  credentials: "include",
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ... })
})

// ✅ 非流式聊天
await fetch("/v1/chat/completions", {
  credentials: "include",
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ... })
})
```

### 3. API 路由认证策略 (routes/v1/*)

修改了 OpenAI 兼容 API 的认证方式，从仅支持 Bearer Token 改为**同时支持 Cookie 和 Bearer Token**：

**之前：**
```typescript
import { requireApiAuth } from "../../../lib/auth.ts";  // 仅 Bearer Token
const authError = requireApiAuth(req);
```

**现在：**
```typescript
import { requireAuth } from "../../../lib/auth.ts";     // Cookie 或 Bearer Token
const authError = requireAuth(req);
```

修改的文件：
- ✅ `routes/v1/chat/completions.ts`
- ✅ `routes/v1/models.ts`

### 4. 认证库错误处理 (lib/auth.ts)

为所有认证函数添加了完整的 try-catch 错误处理，防止 500 错误：

```typescript
export function isAuthenticated(req: Request): boolean {
  try {
    const token = getSessionToken(req);
    if (!token) return false;
    return isValidSession(token);
  } catch (error) {
    console.error("Error in authentication:", error);
    return false;  // 返回 false 而不是抛出异常
  }
}
```

## 认证方式对比

### 管理 API (`/api/*`)

| 路由 | 支持的认证方式 |
|------|---------------|
| `/api/accounts` | Cookie 或 Bearer Token |
| `/api/models` | Cookie 或 Bearer Token |
| `/api/config` | Cookie 或 Bearer Token |
| `/api/status` | Cookie 或 Bearer Token |

### OpenAI 兼容 API (`/v1/*`)

| 路由 | 之前 | 现在 |
|------|------|------|
| `/v1/chat/completions` | 仅 Bearer Token | Cookie 或 Bearer Token |
| `/v1/models` | 仅 Bearer Token | Cookie 或 Bearer Token |

## 使用场景

### 场景 1：Web 界面（使用 Cookie）

1. 用户访问 `/login` 并登录
2. 登录成功后，浏览器自动携带 Cookie
3. 用户可以：
   - 在管理控制台添加/管理账号
   - 在聊天界面直接对话
   - 无需额外配置 API Key

### 场景 2：API 调用（使用 Bearer Token）

```bash
# 聊天 API
curl -X POST https://your-app.deno.dev/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-password" \
  -d '{"model": "gemini-enterprise", "messages": [...]}'

# 管理 API
curl https://your-app.deno.dev/api/accounts \
  -H "Authorization: Bearer your-password"
```

### 场景 3：OpenAI SDK（使用 Bearer Token）

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-password",
    base_url="https://your-app.deno.dev/v1"
)

response = client.chat.completions.create(...)
```

## 测试步骤

1. **重新部署应用**
2. **访问登录页面** 并登录
3. **测试添加账号**：
   - 点击"添加账号"
   - 填写或粘贴 JSON
   - 点击保存
   - 应该能成功添加

4. **测试聊天界面**：
   - 访问 `/chat`
   - 发送消息
   - 应该能正常对话

## 技术细节

### credentials 选项说明

```typescript
credentials: "include"  // 始终发送 Cookie（跨域也发送）
credentials: "same-origin"  // 仅同源时发送 Cookie（默认值）
credentials: "omit"  // 从不发送 Cookie
```

### 认证流程

```
浏览器请求
    ↓
requireAuth() 检查
    ↓
isAuthenticatedAny()
    ├─→ isAuthenticated() → 检查 Cookie
    └─→ isApiAuthenticated() → 检查 Bearer Token
    ↓
任一方式通过 → 允许访问
```

## 文件修改清单

- ✅ `lib/auth.ts` - 添加错误处理
- ✅ `islands/AccountManager.tsx` - 添加 credentials
- ✅ `islands/ChatInterface.tsx` - 添加 credentials  
- ✅ `routes/v1/chat/completions.ts` - 改用 requireAuth
- ✅ `routes/v1/models.ts` - 改用 requireAuth

## 总结

现在系统支持两种灵活的认证方式：

1. **Web 用户**：登录后通过 Cookie 自动认证
2. **API 用户**：通过 Bearer Token 手动认证

两种方式都能访问所有功能，提供最佳的用户体验！
