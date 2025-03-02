# LLM 对话框

一个基于 React + TypeScript 的智能对话界面,集成了 Coze API 实现智能对话功能。

## 主要功能

### 1. 多会话管理
- 支持创建多个独立对话
- 可在不同对话间切换
- 每个对话有独立的历史记录

### 2. 实时对话
- 集成 Coze API 进行智能对话
- 支持流式响应,实时显示 AI 回复

### 3. 文件处理功能
- 支持图片上传预览
- 支持多文件上传

### 4. 代码展示
- Markdown 格式解析
- 代码语法高亮
- 代码块一键复制功能
- 支持多种编程语言

### 5. 界面特性
- 响应式设计,适配移动端
- 自动滚动到最新消息
- 支持快捷键发送(Enter)
- 加载状态提示

### 6. 图片处理
- 支持图片上传到 GitHub
- 支持图片生成
- 自动生成图片预览
- 支持多图片同时上传

## 技术栈

- React 19
- TypeScript
- Vite
- @coze/api
- react-markdown
- react-syntax-highlighter
- GitHub API (图片存储)

## 环境变量配置

项目需要以下环境变量:

```js
VITE_GITHUB_ACCESS_TOKEN=你的GitHub访问令牌
```

## 开发启动

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建项目
npm run build
```

## 项目结构

```
src/
  ├── components/        # 组件目录
  │   ├── ChatDialog.tsx # 主对话框组件
  │   └── type.ts       # 类型定义
  ├── api/              # API 相关
  │   └── imageUploadUtils.ts # 图片上传工具
  ├── config/           # 配置文件
  │   └── initConfig.tsx # Coze API 配置
  └── App.tsx           # 应用入口
```

## 注意事项

1. 使用前需要配置 Coze API 的 token 和 bot_id
2. 需要 GitHub token 来启用图片上传功能
3. 建议使用现代浏览器以获得最佳体验

## License

MIT
