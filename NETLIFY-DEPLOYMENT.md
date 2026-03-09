# Netlify 部署步骤指南

## 前提条件
- GitHub 仓库已创建：https://github.com/steel123456/-homework-system
- 已有 Supabase 项目配置（可选，后续可添加）

---

## 方法一：通过 Netlify 网站部署（推荐）

### 第一步：访问 Netlify
1. 打开浏览器，访问：https://app.netlify.com
2. 点击 **"Sign up"** 或 **"Log in"**
3. 选择 **"GitHub"** 登录

### 第二步：导入项目
1. 登录后，点击 **"Add new site"** → **"Import an existing project"**
2. 选择 **"Deploy with GitHub"**
3. 如果是第一次使用，点击 **"Authorize Netlify"**
4. 在仓库列表中找到 `-homework-system`
5. 如果没看到，点击 **"Configure the Netlify app on GitHub"** → 选择你的仓库

### 第三步：配置构建设置
填写以下信息：

- **Owner**: 选择你的账号
- **Branch to deploy**: `main`
- **Build command**: `pnpm run build`
- **Publish directory**: `.next`

⚠️ **重要：Netlify 需要特殊配置才能运行 Next.js 16**

### 第四步：添加环境变量
点击 **"Advanced"** → **"Add environment variable"**，添加：

```
NEXT_PUBLIC_SUPABASE_URL=你的supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的supabase_anon_key
COZE_SUPABASE_URL=你的supabase_url
COZE_SUPABASE_ANON_KEY=你的supabase_anon_key
```

（如果没有 Supabase，可以先跳过，后续添加）

### 第五步：创建配置文件（重要！）

Netlify 需要使用 `@netlify/plugin-nextjs` 插件来支持 Next.js。

#### 方法 A：创建 netlify.toml（推荐）

在项目根目录创建 `netlify.toml` 文件，我会帮你创建。

#### 方法 B：在 Netlify 界面配置
1. 在 Netlify 控制台，进入你的站点
2. 点击 **"Site settings"** → **"Build & deploy"**
3. 在 **"Build"** 部分：
   - Build command: `pnpm run build`
   - Publish directory: `.next`
4. 在 **"Plugins"** 部分：
   - 搜索并安装 `@netlify/plugin-nextjs`

### 第六步：部署
1. 点击 **"Deploy site"**
2. 等待约 3-5 分钟
3. 部署成功后，点击站点链接访问

---

## 方法二：使用 Netlify CLI 手动部署

### 第一步：安装 Netlify CLI
```bash
npm install -g netlify-cli
```

### 第二步：登录 Netlify
```bash
netlify login
```

### 第三步：初始化项目
```bash
cd /workspace/projects
netlify init
```

按提示选择：
- What would you like to do? → **Create & configure a new site**
- Team → 选择你的账号
- Site name → 输入站点名（如：`homework-system`）或留空
- Build command → `pnpm run build`
- Directory to deploy → `.next`

### 第四步：设置环境变量
```bash
netlify env:set NEXT_PUBLIC_SUPABASE_URL "你的supabase_url"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "你的supabase_key"
netlify env:set COZE_SUPABASE_URL "你的supabase_url"
netlify env:set COZE_SUPABASE_ANON_KEY "你的supabase_key"
```

### 第五步：部署
```bash
netlify deploy --prod
```

---

## 常见问题

### Q: 部署失败，提示 Next.js 不支持？
A: 需要添加 `netlify.toml` 配置文件，或者安装 `@netlify/plugin-nextjs` 插件。

### Q: 页面可以访问，但 API 报错？
A: 确保环境变量已正确设置。在 Netlify 控制台检查：
- Site settings → Environment variables

### Q: 如何绑定自定义域名？
A: 
1. 进入 Site settings → Domain management
2. 点击 "Add custom domain"
3. 输入你的域名
4. 按提示配置 DNS

### Q: Netlify 和 Vercel 哪个更好？
A: 
- **Vercel**: Next.js 官方推荐，支持更好，部署更快
- **Netlify**: 功能更丰富，支持更多框架，但 Next.js 支持稍弱

---

## 部署成功后

你会获得一个永久访问地址：
```
https://homework-system.netlify.app
或
https://你的站点名.netlify.app
```

---

## 需要帮助？

- Netlify 文档：https://docs.netlify.com
- Next.js + Netlify：https://docs.netlify.com/integrations/frameworks/next-js/
- Supabase 配置：https://supabase.com/docs
