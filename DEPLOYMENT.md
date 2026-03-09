# 智能作业管理系统

一个完整的在线教育作业管理平台，支持班级管理、作业布置、图片上传和 AI 智能批改。

## 功能特性

### 用户系统
- 教师和学生两种角色
- 基于 Supabase Auth 的安全认证
- 密码加密存储，解决登录问题

### 班级管理
- 教师创建班级，自动生成邀请码
- 学生通过邀请码加入班级
- 班级成员管理

### 作业系统
- 教师布置作业，设置截止日期
- 学生查看作业列表
- 文字答案提交

### 图片上传
- 学生上传作业图片
- 支持多张图片上传
- 图片预览和删除

### AI 智能批改
- 自动识别作业图片
- 智能评分（0-100分）
- 详细批改反馈和改进建议

## 技术栈

- **前端**: Next.js 16 + TypeScript + shadcn/ui + Tailwind CSS
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **文件存储**: S3 兼容对象存储
- **AI**: LLM 视觉模型
- **部署**: GitHub + Vercel

## 本地开发

### 前置要求

- Node.js 18+
- pnpm 9+

### 安装依赖

\`\`\`bash
pnpm install
\`\`\`

### 环境变量

创建 \`.env.local\` 文件：

\`\`\`env
# Supabase 配置（从 Supabase 控制台获取）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 后端使用的环境变量（自动注入）
COZE_SUPABASE_URL=your_supabase_url
COZE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 对象存储配置（自动注入）
COZE_BUCKET_ENDPOINT_URL=your_bucket_endpoint
COZE_BUCKET_NAME=your_bucket_name
\`\`\`

### 启动开发服务器

\`\`\`bash
pnpm dev
\`\`\`

访问 http://localhost:5000

## 部署到 GitHub + Vercel（免费）

### 第一步：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 填写仓库名称，例如 \`homework-system\`
3. 选择 Private 或 Public
4. 点击 Create repository

### 第二步：推送代码到 GitHub

\`\`\`bash
# 初始化 Git（如果还没有）
git init

# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/homework-system.git

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: 智能作业管理系统"

# 推送到 GitHub
git push -u origin main
\`\`\`

### 第三步：在 Supabase 创建项目

1. 访问 https://supabase.com
2. 点击 "New Project"
3. 填写项目名称和数据库密码
4. 选择离你最近的区域
5. 等待项目创建完成（约 2 分钟）

### 第四步：获取 Supabase 配置

1. 进入 Supabase 项目
2. 点击左侧 "Project Settings" (齿轮图标)
3. 点击 "API"
4. 复制以下信息：
   - Project URL → NEXT_PUBLIC_SUPABASE_URL
   - anon public key → NEXT_PUBLIC_SUPABASE_ANON_KEY

### 第五步：部署到 Vercel

1. 访问 https://vercel.com
2. 使用 GitHub 账号登录
3. 点击 "Add New..." → "Project"
4. 选择你的 GitHub 仓库 \`homework-system\`
5. 点击 "Import"

### 第六步：配置环境变量

在 Vercel 项目设置中添加环境变量：

1. 点击 "Settings" → "Environment Variables"
2. 添加以下变量：

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=你的supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的supabase_anon_key
COZE_SUPABASE_URL=你的supabase_url
COZE_SUPABASE_ANON_KEY=你的supabase_anon_key
COZE_BUCKET_ENDPOINT_URL=自动提供
COZE_BUCKET_NAME=自动提供
\`\`\`

### 第七步：部署

1. 点击 "Deployments"
2. 点击最新部署的 "..." → "Redeploy"
3. 等待部署完成（约 2 分钟）
4. 访问分配的域名

### 绑定自定义域名（可选）

1. 在 Vercel 项目中点击 "Settings" → "Domains"
2. 输入你的域名
3. 按照提示在域名服务商处添加 DNS 记录
4. 等待 DNS 生效

## 使用指南

### 教师端

1. 注册教师账号
2. 创建班级，获取邀请码
3. 将邀请码分享给学生
4. 布置作业，设置截止日期
5. 查看学生提交
6. 手动批改或使用 AI 批改

### 学生端

1. 注册学生账号
2. 使用邀请码加入班级
3. 查看作业列表
4. 提交作业（文字 + 图片）
5. 获取 AI 即时反馈
6. 查看批改结果

## 常见问题

### Q: 注册后无法登录？
A: 本系统使用 Supabase Auth，密码经过加密存储，确保登录安全。如遇问题，请检查：
- 邮箱格式是否正确
- 密码是否至少 6 位
- 是否已完成注册

### Q: 图片上传失败？
A: 请检查：
- 图片大小是否超过 10MB
- 图片格式是否为 JPG/PNG/GIF/WebP
- 网络连接是否正常

### Q: AI 批改不准确？
A: AI 批改基于视觉模型，建议：
- 上传清晰的作业图片
- 文字答案书写工整
- 图片光线充足

## 许可证

MIT License

## 支持

如有问题，请提交 Issue 或联系开发者。
