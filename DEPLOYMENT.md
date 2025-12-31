# Deploy to Render.com

## Prerequisites
- GitHub account
- Render.com account (free)

## Deployment Steps

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/website-scanner.git
git push -u origin main
```

### 2. Connect to Render
1. Go to https://render.com
2. Sign up/login with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repository
5. Select `website-scanner` repo

### 3. Configure Service
Render will auto-detect `render.yaml`, but verify:

**Basic Settings:**
- Name: `website-scanner`
- Region: `Oregon (US West)`
- Branch: `main`
- Root Directory: (leave blank)
- Runtime: `Node`

**Build & Deploy:**
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

**Plan:**
- Select **"Free"** tier

### 4. Environment Variables (Optional)
If needed, add in Render dashboard:
- `NODE_ENV` = `production`

### 5. Deploy
- Click **"Create Web Service"**
- Wait 5-10 minutes for first build
- Your app will be live at: `https://website-scanner.onrender.com`

## Important Notes

### Free Tier Limitations:
- ✅ 90-second timeout (good for scans)
- ✅ 512MB RAM (sufficient for Puppeteer)
- ⚠️ Spins down after 15 min inactivity (first load takes 30s)
- ⚠️ 750 hours/month free

### Puppeteer on Render:
Render includes Chrome by default, so Puppeteer works out of the box.

### Custom Domain (Optional):
1. Go to dashboard → Settings
2. Add custom domain
3. Update DNS records

## Troubleshooting

### Build fails?
Check build logs in Render dashboard. Common issues:
- Missing dependencies: Run `npm install` locally first
- Memory errors: Optimize code or upgrade plan

### Scans timeout?
- Free tier has 90s limit
- Remove heavy features (Lighthouse, screenshots)
- Or upgrade to paid plan ($7/month = 300s timeout)

### App sleeps?
- Free tier spins down after 15 min idle
- First request takes 30+ seconds to wake up
- Paid plans stay always-on

## Monitoring
- View logs: Dashboard → Logs tab
- Check metrics: Dashboard → Metrics tab
- Set up alerts: Dashboard → Settings → Notifications
