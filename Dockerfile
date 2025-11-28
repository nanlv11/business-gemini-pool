# 使用官方 Deno 镜像（使用 latest 标签以提高可用性）
FROM denoland/deno:latest

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV DENO_DIR=/deno-dir
ENV DENO_DEPLOYMENT_ID=docker

# 复制依赖配置文件
COPY deno.json ./
COPY fresh.config.ts ./

# 预缓存依赖（加速后续构建）
RUN deno cache --reload \
    https://deno.land/x/fresh@1.6.1/server.ts \
    https://deno.land/x/fresh@1.6.1/dev.ts

# 复制所有源代码
COPY . .

# 生成 Fresh manifest
RUN deno task manifest

# 构建生产版本（可选，Fresh 支持运行时构建）
# RUN deno task build

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD deno eval "fetch('http://localhost:8000/').then(() => Deno.exit(0)).catch(() => Deno.exit(1))"

# 启动应用（生产模式）
CMD ["deno", "run", "-A", "--unstable-kv", "main.ts"]
