# Cookie 总是过期问题分析

## 🔍 问题原因

### 当前实现
```typescript
// lib/auth.ts
const sessions = new Set<string>();  // ❌ 存储在内存中
```

### 问题流程

```
1. 用户登录
   ↓
2. 生成会话令牌 → 存储到内存 Set
   ↓
3. 设置 Cookie（7天有效期）→ 浏览器保存
   ↓
4. 用户访问页面 → 发送 Cookie
   ↓
5. 服务器重启（Deno Deploy 自动部署/重启）
   ↓
6. 内存清空 → 所有会话令牌丢失
   ↓
7. 用户再次访问
   ↓
8. 浏览器发送 Cookie（令牌仍然有效）
   ↓
9. 服务器检查：令牌不在 Set 中 → 认证失败
   ↓
10. 重定向到登录页 ❌
```

## 📊 Deno Deploy 重启场景

| 场景 | 频率 | 影响 |
|------|------|------|
| 代码部署 | 每次 git push | 会话全部失效 |
| 自动扩容 | 按需 | 部分会话失效 |
| 系统维护 | 偶尔 | 会话全部失效 |
| 冷启动 | 无活动后 | 会话全部失效 |

## ⚠️ 用户体验问题

- 用户频繁需要重新登录
- Cookie 明明存在但无法访问
- 7天过期时间形同虚设
- 看起来像是"Cookie 总是过期"

## ✅ 解决方案：使用 Deno KV 持久化会话

### 方案对比

| 方案 | 优点 | 缺点 | 重启后 |
|------|------|------|--------|
| **内存 Set** | 快速、简单 | 重启丢失 | ❌ 失效 |
| **Deno KV** | 持久化、可靠 | 稍慢 | ✅ 保留 |

### 实现方案

使用 Deno KV 存储会话，重启后仍然有效：

```typescript
// 创建会话 - 存储到 KV
export async function createSession(kv: Deno.Kv): Promise<string> {
  const token = generateSessionToken();
  await kv.set(
    ["sessions", token], 
    {
      created_at: Date.now(),
      expires_at: Date.now() + 604800000, // 7天
    }, 
    {
      expireIn: 604800000, // 7天后自动删除
    }
  );
  return token;
}

// 验证会话 - 从 KV 读取
export async function isValidSession(
  kv: Deno.Kv, 
  token: string
): Promise<boolean> {
  const entry = await kv.get(["sessions", token]);
  return entry.value !== null;
}

// 销毁会话 - 从 KV 删除
export async function destroySession(
  kv: Deno.Kv, 
  token: string
): Promise<void> {
  await kv.delete(["sessions", token]);
}
```

### 优势

1. ✅ **服务器重启后会话保持** - KV 数据持久化
2. ✅ **真正的7天有效期** - Deno KV 自动过期
3. ✅ **跨实例共享** - 多个服务器实例共享会话
4. ✅ **自动清理** - expireIn 自动删除过期会话

## 🔧 需要修改的文件

1. **lib/auth.ts** - 改用 Deno KV 存储会话
2. **routes/api/auth/login.ts** - 传递 kv 实例
3. **routes/api/auth/logout.ts** - 传递 kv 实例
4. **所有认证检查** - 传递 kv 实例

## 📝 实施步骤

1. 修改 `lib/auth.ts` 中的会话管理函数
2. 更新登录/登出路由
3. 更新认证中间件
4. 测试会话持久化
5. 部署验证

## 🎯 预期效果

修复后：
- ✅ 用户登录一次可保持7天
- ✅ 服务器重启不影响登录状态
- ✅ 真正的"记住我"功能
- ✅ 更好的用户体验
