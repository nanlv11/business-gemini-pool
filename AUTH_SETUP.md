# 认证系统设置完成

## 已实现的功能

### 1. 登录系统
- ✅ 登录页面 (`/login`)
- ✅ 登出功能（首页和聊天页面右上角）
- ✅ 基于 Cookie 的会话管理（7天有效期）

### 2. API Key 认证
- ✅ OpenAI 标准 Bearer Token 格式
- ✅ `/v1/chat/completions` 需要 API Key
- ✅ `/v1/models` 需要 API Key

### 3. 管理 API 保护
- ✅ 所有 `/api/*` 路由都需要认证
- ✅ 支持 Cookie 或 Bearer Token 两种方式

### 4. 页面保护
- ✅ 首页 (`/`) - 需要登录
- ✅ 聊天页面 (`/chat`) - 需要登录
- ✅ 未登录自动跳转到登录页

## 环境变量配置

```bash
# 本地开发
export ADMIN_PASSWORD="your-secure-password"
deno task start

# Deno Deploy
在项目设置中添加环境变量：
ADMIN_PASSWORD=your-secure-password
```

如果未设置，默认密码为 `admin`

## 使用示例

### Web 登录

1. 访问 `http://localhost:8000`
2. 自动跳转到 `/login`
3. 输入密码（默认 `admin`）
4. 登录后可访问管理控制台

### API 调用

```bash
# 聊天 API
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin" \
  -d '{
    "model": "gemini-enterprise",
    "messages": [{"role": "user", "content": "Hello"}]
  }'

# 列出模型
curl http://localhost:8000/v1/models \
  -H "Authorization: Bearer admin"

# 管理 API（使用 Cookie 或 Bearer Token）
curl http://localhost:8000/api/accounts \
  -H "Authorization: Bearer admin"
```

### Python OpenAI SDK

```python
from openai import OpenAI

client = OpenAI(
    api_key="admin",  # 使用你的 ADMIN_PASSWORD
    base_url="http://localhost:8000/v1"
)

response = client.chat.completions.create(
    model="gemini-enterprise",
    messages=[{"role": "user", "content": "Hello"}]
)

print(response.choices[0].message.content)
```

## 文件更新列表

### 新增文件
- `lib/auth.ts` - 认证核心库
- `routes/login.tsx` - 登录页面
- `routes/api/auth/login.ts` - 登录 API
- `routes/api/auth/logout.ts` - 登出 API

### 修改文件
- `routes/index.tsx` - 添加认证保护和登出按钮
- `routes/chat.tsx` - 添加认证保护和登出按钮
- `routes/v1/chat/completions.ts` - 添加 API Key 认证
- `routes/v1/models.ts` - 添加 API Key 认证
- `routes/api/accounts/index.ts` - 添加认证
- `routes/api/accounts/[id]/index.ts` - 添加认证
- `routes/api/accounts/[id]/test.ts` - 添加认证
- `routes/api/accounts/[id]/toggle.ts` - 添加认证
- `routes/api/config/index.ts` - 添加认证
- `routes/api/models/index.ts` - 添加认证
- `routes/api/models/[id].ts` - 添加认证
- `routes/api/status.ts` - 添加认证
- `fresh.gen.ts` - 添加新路由
- `README.md` - 添加认证文档

## 安全建议

1. **生产环境务必修改密码**：
   ```bash
   ADMIN_PASSWORD="使用强密码，至少16位，包含大小写字母、数字和特殊字符"
   ```

2. **使用 HTTPS**：
   Deno Deploy 自动提供 HTTPS

3. **定期更换密码**：
   建议每月更换一次

4. **不要将密码提交到代码仓库**：
   只通过环境变量配置

## 测试认证

```bash
# 启动服务
deno task start

# 测试未认证访问（应该返回 401）
curl http://localhost:8000/v1/models

# 测试认证访问（应该成功）
curl http://localhost:8000/v1/models \
  -H "Authorization: Bearer admin"
```

## 下一步

认证系统已完全配置完成，您可以：
1. 设置强密码并部署到 Deno Deploy
2. 测试 Web 登录功能
3. 测试 API Key 认证
4. 添加第一个 Gemini 账号并开始使用
