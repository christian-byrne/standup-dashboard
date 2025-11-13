# 📊 Standup Dashboard

AI-powered development summaries with GitHub integration and futuristic mission control UI.

## ✨ Features

- 🤖 **AI-Powered Summaries** - Claude AI generates concise standup bullets from GitHub activity
- 📈 **GitHub Integration** - Automatically tracks PRs, commits, and repository activity  
- 🎯 **Interactive Timeline** - Visual timeline of development activity with real-time updates
- ☁️ **Cloud Storage** - Optional Supabase integration for team collaboration
- 🌙 **Futuristic UI** - Mission control aesthetics with holographic effects
- 📱 **Mobile Optimized** - Responsive design with touch gestures and swipe navigation
- 📋 **Copy-to-Clipboard** - Easy sharing to Slack and other platforms

## 🚀 Quick Start

1. **Clone and install:**
   ```bash
   git clone <your-repo-url>
   cd standup-dashboard
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your API keys:
   ```env
   GITHUB_TOKEN=ghp_your_github_token
   CLAUDE_API_KEY=sk-your_claude_key
   GITHUB_USERNAME=your-username
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Generate your first standup:**
   ```bash
   npm run standup:run
   ```

## 🔧 Configuration

### Required Environment Variables

 < /dev/null |  Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_TOKEN` | GitHub personal access token with repo access | ✅ |
| `CLAUDE_API_KEY` | Anthropic Claude API key | ✅ |
| `GITHUB_USERNAME` | Your GitHub username to track | ✅ |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CLAUDE_MODEL` | Claude model to use | `claude-3-haiku-20240307` |
| `STANDUP_LOOKBACK_HOURS` | Hours of activity to include | `24` |
| `SUPABASE_URL` | Supabase project URL (for cloud storage) | - |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | - |

## 📦 Deployment

### Vercel (Recommended)

1. **Connect to Vercel:**
   - Import your GitHub repository
   - Set environment variables in Vercel dashboard
   - Deploy automatically

2. **Set up environment variables in Vercel:**
   ```
   GITHUB_TOKEN=your_token
   CLAUDE_API_KEY=your_key  
   GITHUB_USERNAME=your_username
   ```

## 🎯 Usage

### Generate Standups

**Manual generation:**
```bash
npm run standup:run
```

**Schedule daily generation:**
```bash
npm run standup:schedule
```

## 📱 Mobile Experience

- Responsive design optimized for mobile devices
- Touch gestures for timeline interaction  
- Swipe navigation for activity cards
- Mobile-first loading states and error handling

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes  
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License
