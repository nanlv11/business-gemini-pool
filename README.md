# Business Gemini Pool - Deno Fresh 版本

基于 Deno Fresh 框架的 Google Gemini Enterprise API 代理服务，提供多账号轮训、OpenAI 兼容接口和完整的管理控制台。

## 功能特性

### 核心功能
- **多账号轮训管理**: 使用 Deno KV 实现原子性轮训调度
- **OpenAI 兼容 API**: 支持 `/v1/chat/completions` 和 `/v1/models` 接口
- **流式/非流式响应**: 完整支持 Server-Sent Events (SSE)
- **管理控制台**: 基于 Fresh Islands 的 Web UI
- **密码认证**: 环境变量配置的访问密码保护
- **API Key 认证**: 支持 OpenAI 格式的 Bearer Token 认证
- **JWT 自动管理**: 自动获取和缓存 JWT（240秒有效期）
- **会话管理**: 自动创建和复用 Gemini 会话

### 图片/视频处理
- **多模型支持**: 支持 `gemini-2.5-flash`、`gemini-image`（图片生成）、`gemini-video`（视频生成）
- **图片缓存**: 使用 Deno KV 缓存小图片（<60KB）
- **cfbed 上传集成**: 支持将生成的图片/视频上传到 cfbed 服务
- **流式处理**: Docker 部署支持大文件流式下载和上传（避免内存溢出）
- **429 错误处理**: 自动检测并处理速率限制错误

### 部署选项
- **Docker 部署**: 2GB 内存，适合处理大文件
- **Deno Deploy**: 128MB 内存限制，适合轻量级使用
- **本地开发**: 快速开发和测试

## 技术栈

- **运行时**: Deno 1.40+
- **框架**: Fresh 1.6+ (Preact-based SSR)
- **数据库**: Deno KV (内置键值存储)
- **CSS**: Tailwind CSS 3.x (CDN)
- **状态管理**: Preact Signals
- **部署**: Docker / Deno Deploy
- **图片上传**: cfbed 上传服务集成（可选）

## 快速开始

### 方式一：Docker 部署（推荐）

**适用场景**：需要处理大文件（视频、大图片）或需要自定义内存配置

1. **前置要求**
   - Docker 20.10+
   - Docker Compose 2.0+

2. **构建并启动**
```bash
# 克隆项目
git clone <your-repo-url>
cd business-gemini-pool

# 构建并启动容器（后台运行）
docker compose up -d --build

# 查看日志
docker compose logs -f
```

3. **访问应用**
- 登录页面: http://localhost:8000/login
- 管理控制台: http://localhost:8000 (需要登录)
- 聊天界面: http://localhost:8000/chat (需要登录)
- API 端点: http://localhost:8000/v1/chat/completions (需要 API Key)

4. **配置说明**
   - 默认内存限制：2GB（可在 `docker-compose.yml` 中调整）
   - 数据持久化：`./data/kv.db`（Deno KV 数据库）
   - 详细文档：查看 [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)

**常用命令**：
```bash
# 停止服务
docker compose down

# 重启服务
docker compose restart

# 查看资源使用
docker stats business-gemini-pool

# 重新构建
docker compose up -d --build --force-recreate
```

### 方式二：本地运行

**适用场景**：开发测试或小规模使用

1. **安装 Deno** (如果尚未安装)
```bash
curl -fsSL https://deno.land/install.sh | sh
```

2. **设置访问密码** (可选，默认为 'admin')
```bash
export ADMIN_PASSWORD="your-secure-password"
```

3. **启动开发服务器**
```bash
deno task start
```

4. **访问应用**
- 登录页面: http://localhost:8000/login
- 管理控制台: http://localhost:8000 (需要登录)
- 聊天界面: http://localhost:8000/chat (需要登录)
- API 端点: http://localhost:8000/v1/chat/completions (需要 API Key)

### 方式三：部署到 Deno Deploy

**适用场景**：无服务器部署，但有 128MB 内存限制

⚠️ **注意**：Deno Deploy 有 128MB 内存限制，不适合处理大文件（视频、大图片）。推荐使用 Docker 部署。

1. **安装 deployctl**
```bash
deno install -Arf https://deno.land/x/deploy/deployctl.ts
```

2. **部署到生产环境**
```bash
deployctl deploy --project=your-project-name --prod main.ts
```

3. **配置环境变量**
在 Deno Deploy 控制台设置：
- `ADMIN_PASSWORD`: 访问密码（必需，用于Web登录和API认证）
- `PROXY_URL`: HTTP 代理地址（可选）

## 使用说明

### 1. 登录系统

首次访问需要登录：

1. 访问部署的 URL，自动跳转到登录页面
2. 输入环境变量 `ADMIN_PASSWORD` 设置的密码
3. 登录后可访问管理控制台和聊天界面

### 2. 添加账号

在管理控制台添加 Gemini Enterprise 账号：

1. 点击"添加账号"按钮
2. 填写以下信息：
   - **Team ID**: Google Business 团队 ID
   - **Secure C SES**: Cookie 中的 `__Secure-C_SES` 值
   - **Host C OSES** (可选): Cookie 中的 `__Host-C_OSES` 值
   - **CSESIDX**: 会话索引
   - **User Agent** (可选): 浏览器 User Agent

3. 点击"测试"按钮验证账号可用性

### 3. OpenAI 兼容 API 使用

#### 聊天完成 (Chat Completions)

**使用 API Key 认证（推荐）：**

```bash
curl -X POST https://your-app.deno.dev/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-admin-password" \
  -d '{
    "model": "gemini-enterprise",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "stream": false
  }'
```

#### 流式响应

```bash
curl -X POST https://your-app.deno.dev/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-admin-password" \
  -d '{
    "model": "gemini-enterprise",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "stream": true
  }'
```

#### 列出模型

```bash
curl https://your-app.deno.dev/v1/models \
  -H "Authorization: Bearer your-admin-password"
```

### 4. 在代码中使用

**Python (使用 OpenAI SDK):**

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-admin-password",
    base_url="https://your-app.deno.dev/v1"
)

response = client.chat.completions.create(
    model="gemini-enterprise",
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)

print(response.choices[0].message.content)
```

**Node.js:**

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'your-admin-password',
  baseURL: 'https://your-app.deno.dev/v1'
});

const response = await openai.chat.completions.create({
  model: 'gemini-enterprise',
  messages: [{ role: 'user', content: 'Hello!' }]
});

console.log(response.choices[0].message.content);
```

### 5. 管理 API

管理 API 支持两种认证方式：
- **Cookie 认证**：通过 Web 登录后自动携带
- **Bearer Token 认证**：在请求头中添加 `Authorization: Bearer <password>`

#### 账号管理
- `GET /api/accounts` - 列出所有账号
- `POST /api/accounts` - 创建账号
- `PUT /api/accounts/:id` - 更新账号
- `DELETE /api/accounts/:id` - 删除账号
- `POST /api/accounts/:id/toggle` - 启用/禁用账号
- `POST /api/accounts/:id/test` - 测试账号连接

#### 模型管理
- `GET /api/models` - 列出所有模型
- `POST /api/models` - 创建模型
- `PUT /api/models/:id` - 更新模型
- `DELETE /api/models/:id` - 删除模型

#### 配置管理
- `GET /api/config` - 获取配置
- `PUT /api/config` - 更新配置

**可配置项**：
- `proxy`: HTTP 代理地址（可选）
- `upload_endpoint`: cfbed 上传服务地址（如 `https://cfbed.sanyue.de/upload`）
- `upload_api_token`: cfbed API Token
- `image_base_url`: 图片访问基础 URL（可选，默认从 `upload_endpoint` 推断）

**配置示例**：
```bash
curl -X PUT https://your-app.deno.dev/api/config \
  -H "Authorization: Bearer your-admin-password" \
  -H "Content-Type: application/json" \
  -d '{
    "upload_endpoint": "https://cfbed.sanyue.de/upload",
    "upload_api_token": "your-cfbed-token",
    "image_base_url": "https://cfbed.sanyue.de"
  }'
```

#### 系统状态
- `GET /api/status` - 获取系统状态

## 项目结构

```
business-gemini-pool/
├── lib/                     # 核心业务逻辑
│   ├── account-manager.ts   # 多账号轮训管理
│   ├── jwt-manager.ts       # JWT 缓存管理
│   ├── session-manager.ts   # 会话管理
│   ├── gemini-api.ts        # Gemini API 封装（支持流式下载）
│   ├── image-cache.ts       # 图片缓存
│   ├── upload-service.ts    # cfbed 上传服务集成
│   ├── config-store.ts      # 配置存储
│   ├── auth.ts              # 认证管理
│   └── types.ts             # TypeScript 类型
├── routes/                  # 路由定义
│   ├── index.tsx            # 管理控制台页面
│   ├── login.tsx            # 登录页面
│   ├── chat.tsx             # 聊天界面页面
│   ├── api/                 # 管理 API
│   │   ├── auth/            # 认证 API
│   │   ├── accounts/        # 账号管理 API
│   │   ├── models/          # 模型管理 API
│   │   ├── config/          # 配置管理 API
│   │   └── images/          # 图片访问 API
│   └── v1/                  # OpenAI 兼容 API
│       └── chat/completions.ts  # 聊天完成接口
├── islands/                 # 客户端交互组件
│   ├── AccountManager.tsx   # 账号管理界面
│   └── ChatInterface.tsx    # 聊天界面
├── data/                    # 数据目录（Docker）
│   └── kv.db               # Deno KV 数据库
├── Dockerfile              # Docker 镜像配置
├── docker-compose.yml      # Docker Compose 配置
├── .dockerignore           # Docker 忽略文件
├── .env.example            # 环境变量示例
├── DOCKER_DEPLOYMENT.md    # Docker 部署文档
├── deno.json               # Deno 配置
├── main.ts                 # 应用入口
└── fresh.config.ts         # Fresh 配置
```

## 核心架构

### 认证系统

- **Web 登录**: 基于 Cookie 的会话认证
- **API 认证**: 支持 OpenAI 标准的 Bearer Token 认证
- **统一密码**: 使用环境变量 `ADMIN_PASSWORD` 配置
- **会话管理**: 内存存储，重启后失效（7天有效期）

### 多账号轮训调度

使用 Deno KV 的原子操作 (`kv.atomic()`) 和乐观锁实现并发安全的轮训调度：

```typescript
const res = await kv.get<number>(indexKey);
const commitResult = await kv.atomic()
  .check(res)  // 乐观锁
  .set(indexKey, nextIndex)
  .commit();
```

### JWT 缓存策略

- 缓存时间: 240 秒（实际有效期 300 秒）
- 自动刷新: 过期时自动重新获取
- 跨请求共享: 通过 Deno KV 实现

### 图片/视频处理

#### 存储策略
- **配置了 cfbed**: 所有图片/视频上传到 cfbed 服务（推荐）
- **未配置 cfbed**:
  - 小图片 (<60KB): 存储到 Deno KV，1小时后自动过期
  - 大图片 (>60KB): 返回下载 URL（实时从 Gemini 下载）

#### 流式处理（Docker 部署）
- **大文件优化**: 使用 ReadableStream 实现零内存占用的文件传输
- **避免 OOM**: 文件直接从 Gemini 流式传输到 cfbed，不经过内存
- **内存限制**: Docker 默认 2GB 内存，可处理任意大小的视频文件

#### 模型支持
- `gemini-2.5-flash`: 通用对话模型（默认）
- `gemini-image`: 图片生成专用模型
- `gemini-video`: 视频生成专用模型

## 故障排除

### 登录失败

1. 确认环境变量 `ADMIN_PASSWORD` 已设置
2. 如未设置，默认密码为 'admin'
3. 检查浏览器控制台是否有错误

### API 认证失败

1. 确保请求头包含 `Authorization: Bearer <password>`
2. 密码必须与环境变量 `ADMIN_PASSWORD` 一致
3. 检查 Bearer 和密码之间有空格

### 账号测试失败

1. 检查 Cookie 值是否正确（`__Secure-C_SES`, `__Host-C_OSES`）
2. 验证 Team ID 和 CSESIDX 是否匹配
3. 如果使用代理，确保代理可访问

### 所有账号都不可用

1. 访问管理控制台查看账号状态
2. 点击"测试"按钮逐个验证
3. 查看不可用原因（401/404 错误）
4. 更新 Cookie 或重新添加账号

### 流式响应不工作

1. 确保客户端支持 Server-Sent Events (SSE)
2. 检查浏览器控制台是否有错误
3. 尝试使用非流式模式 (`stream: false`)

### Docker 相关问题

#### 容器无法启动
```bash
# 查看详细日志
docker compose logs

# 检查端口占用
netstat -tulpn | grep 8000  # Linux
netstat -ano | findstr :8000  # Windows

# 检查磁盘空间
df -h  # Linux
```

#### 内存不足 (OOM)
1. 增加 `docker-compose.yml` 中的 `mem_limit`（如改为 4g）
2. 检查内存使用：`docker stats business-gemini-pool`
3. 重启容器：`docker compose restart`

#### 数据丢失
1. 确保 `./data` 目录存在且有写权限
2. 检查 volume 挂载：`docker compose config`
3. 定期备份：`cp -r ./data ./data.backup`

#### cfbed 上传失败
1. 检查配置：`GET /api/config`
2. 验证 `upload_endpoint` 和 `upload_api_token` 是否正确
3. 测试网络连接：`curl https://cfbed.sanyue.de`
4. 查看容器日志：`docker compose logs -f`

## 安全注意事项

- ⚠️ **重要**: 生产环境务必设置强密码作为 `ADMIN_PASSWORD`
- ⚠️ Cookie 值包含敏感凭证，请勿泄露
- ⚠️ API Key（即 `ADMIN_PASSWORD`）应妥善保管，不要提交到代码仓库
- ⚠️ 建议使用 HTTPS 部署，保护传输安全
- ⚠️ 定期更换访问密码

## 开发任务

```bash
# 代码检查
deno task check

# 启动开发服务器（热重载）
deno task start

# 生成路由清单
deno task manifest

# 构建生产版本
deno task build

# 运行生产服务器
deno task preview
```

## License

MIT

## 致谢

基于 Flask 版本迁移而来，感谢原项目贡献者。
