# FriCon - Social Network Frontend

## Deployment Guide

### Deploy trên Railway 🚂

1. **Chuẩn bị:**
   - Tạo tài khoản tại [Railway.app](https://railway.app)
   - Cài đặt Railway CLI (tùy chọn): `npm install -g @railway/cli`

2. **Deploy qua GitHub (Khuyến nghị):**
   - Push code lên GitHub repository
   - Vào Railway Dashboard → New Project → Deploy from GitHub repo
   - Chọn repository của bạn
   - Railway sẽ tự động phát hiện Dockerfile và deploy

3. **Deploy qua Railway CLI:**
   ```bash
   railway login
   railway init
   railway up
   ```

4. **Cấu hình:**
   - Railway sẽ tự động expose port 80
   - Thêm domain tùy chỉnh trong Settings → Domains (nếu cần)
   - Thêm environment variables trong Variables tab (nếu cần)

### Deploy trên Vercel 🔺

1. **Chuẩn bị:**
   - Tạo tài khoản tại [Vercel.com](https://vercel.com)
   - Cài đặt Vercel CLI (tùy chọn): `npm install -g vercel`

2. **Deploy qua GitHub (Khuyến nghị):**
   - Push code lên GitHub repository
   - Vào Vercel Dashboard → Add New Project
   - Import repository của bạn
   - Vercel sẽ tự động detect Vite và deploy

3. **Deploy qua Vercel CLI:**
   ```bash
   vercel login
   vercel
   ```

4. **Cấu hình:**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Environment Variables

Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

Sau đó cập nhật các giá trị API URL phù hợp.

### Local Development

```bash
# Cài đặt dependencies
npm install

# Chạy dev server
npm run dev

# Build production
npm run build

# Preview production build
npm run preview
```

### Docker Local Testing

```bash
# Build Docker image
docker build -t fricon-fe .

# Run container
docker run -p 8080:80 fricon-fe

# Truy cập: http://localhost:8080
```

## Tech Stack

- React 18
- TypeScript
- Vite
- TailwindCSS
- Ant Design
- React Router
- Zustand (State Management)
- Axios
- SignalR (Real-time chat)

## Files đã tạo cho deployment:

- ✅ `Dockerfile` - Multi-stage build với Nginx
- ✅ `.dockerignore` - Optimize Docker build
- ✅ `nginx.conf` - Cấu hình Nginx cho SPA routing
- ✅ `vercel.json` - Cấu hình Vercel deployment
- ✅ `.env.example` - Template cho environment variables
