# Cloud Deployment Guide

## 🚀 Quick Deploy Options (Recommended for Hackathon)

### Option 1: Render.com (Easiest - 15 minutes)

#### Backend Deployment
1. **Sign up** at [render.com](https://render.com)
2. **Create PostgreSQL Database**:
   - Click "New +" → "PostgreSQL"
   - Name: `hospital-db`
   - Note down the Internal Database URL

3. **Deploy Backend**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     ```
     Name: hospital-backend
     Region: Choose closest to India (Singapore)
     Branch: main
     Root Directory: backend
     Runtime: Python 3
     Build Command: pip install -r requirements.txt
     Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Environment Variables**:
     ```
     DATABASE_URL=<your-postgres-internal-url>
     SECRET_KEY=your-secret-key-here-make-it-random
     ```
   - Deploy!

#### Frontend Deployment
1. **Deploy to Render**:
   - Click "New +" → "Static Site"
   - Connect repository
   - Configure:
     ```
     Name: hospital-frontend
     Branch: main
     Root Directory: frontend
     Build Command: npm install && npm run build
     Publish Directory: dist
     ```
   - **Environment Variables**:
     ```
     VITE_API_URL=<your-backend-url>
     ```

**Total Time**: ~15 minutes
**Cost**: Free tier available

---

### Option 2: Railway.app (Fast - 10 minutes)

1. **Sign up** at [railway.app](https://railway.app)
2. **Create New Project** → "Deploy from GitHub"
3. **Add PostgreSQL**:
   - Click "New" → "Database" → "PostgreSQL"
   - Copy DATABASE_URL

4. **Deploy Backend**:
   - Add service from repo
   - Settings → Variables:
     ```
     DATABASE_URL=${{Postgres.DATABASE_URL}}
     SECRET_KEY=random-secret-key
     PORT=8000
     ```
   - Settings → Deploy:
     ```
     Root Directory: backend
     Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```

5. **Deploy Frontend**:
   - Add another service
   - Settings → Variables:
     ```
     VITE_API_URL=<backend-url>
     ```
   - Auto-deploys with Vite

**Total Time**: ~10 minutes
**Cost**: $5/month (free $5 credit)

---

### Option 3: Vercel (Frontend) + Render (Backend)

#### Backend on Render (see Option 1)

#### Frontend on Vercel
1. **Sign up** at [vercel.com](https://vercel.com)
2. **Import Project**:
   - Click "New Project"
   - Import your GitHub repository
   - Framework Preset: Vite
   - Root Directory: `frontend`
3. **Environment Variables**:
   ```
   VITE_API_URL=<your-backend-url>
   ```
4. **Deploy** (automatic)

**Total Time**: ~12 minutes
**Cost**: Free

---

## 🐳 Docker Deployment (For Judges - Shows Technical Depth)

### Create Dockerfile for Backend

Create `backend/Dockerfile`:
```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Create Dockerfile for Frontend

Create `frontend/Dockerfile`:
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy and build
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: hospital_db
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://admin:secure_password@postgres:5432/hospital_db
      SECRET_KEY: your-secret-key-here
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

**Run**: `docker-compose up --build`

---

## ☁️ Traditional Cloud Platforms

### AWS Deployment

#### Using AWS Elastic Beanstalk + RDS

1. **Setup RDS PostgreSQL**:
   ```bash
   aws rds create-db-instance \
     --db-instance-identifier hospital-db \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --master-username admin \
     --master-user-password YourPassword123 \
     --allocated-storage 20
   ```

2. **Deploy Backend** (Elastic Beanstalk):
   ```bash
   cd backend
   eb init -p python-3.12 hospital-backend
   eb create hospital-backend-env
   eb setenv DATABASE_URL=<rds-url> SECRET_KEY=<key>
   eb deploy
   ```

3. **Deploy Frontend** (S3 + CloudFront):
   ```bash
   cd frontend
   npm run build
   aws s3 sync dist/ s3://hospital-frontend-bucket
   aws cloudfront create-distribution --origin-domain-name hospital-frontend-bucket.s3.amazonaws.com
   ```

**Cost**: ~$20-30/month

---

### Azure Deployment

1. **Create Resources**:
   ```bash
   # Create resource group
   az group create --name hospital-rg --location eastasia

   # Create PostgreSQL
   az postgres server create \
     --resource-group hospital-rg \
     --name hospital-db-server \
     --admin-user admin \
     --admin-password YourPassword123

   # Create App Service
   az webapp up --runtime PYTHON:3.12 --name hospital-backend
   ```

2. **Configure Environment**:
   ```bash
   az webapp config appsettings set \
     --resource-group hospital-rg \
     --name hospital-backend \
     --settings DATABASE_URL=<connection-string> SECRET_KEY=<key>
   ```

**Cost**: ~$25-40/month

---

### Google Cloud Platform

1. **Setup Cloud SQL**:
   ```bash
   gcloud sql instances create hospital-db \
     --database-version=POSTGRES_15 \
     --tier=db-f1-micro \
     --region=asia-south1
   ```

2. **Deploy Backend** (Cloud Run):
   ```bash
   cd backend
   gcloud run deploy hospital-backend \
     --source . \
     --platform managed \
     --region asia-south1 \
     --set-env-vars DATABASE_URL=<url>,SECRET_KEY=<key>
   ```

3. **Deploy Frontend** (Firebase Hosting):
   ```bash
   cd frontend
   npm install -g firebase-tools
   firebase init hosting
   npm run build
   firebase deploy
   ```

**Cost**: ~$15-25/month

---

## 🔧 Pre-Deployment Checklist

### Backend Preparation

1. **Update requirements.txt** (already done):
   ```txt
   fastapi
   uvicorn
   sqlalchemy
   psycopg2-binary
   prophet
   python-jose[cryptography]
   passlib[bcrypt]
   email-validator
   pandas
   numpy
   ```

2. **Environment Variables Needed**:
   ```bash
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   SECRET_KEY=your-very-secret-key-at-least-32-characters-long
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ```

3. **Add CORS for production** in `backend/app/main.py`:
   ```python
   origins = [
       "http://localhost:3000",
       "https://your-frontend-domain.com",
       "https://your-frontend-domain.vercel.app",
   ]
   ```

### Frontend Preparation

1. **Create `.env.production`**:
   ```bash
   VITE_API_URL=https://your-backend-url.com/api
   ```

2. **Update `vite.config.js`** for production:
   ```javascript
   export default defineConfig({
     server: {
       proxy: {
         '/api': {
           target: process.env.VITE_API_URL || 'http://localhost:8000',
           changeOrigin: true,
         }
       }
     }
   })
   ```

### Database Migration

1. **Initialize database on deployment**:
   ```bash
   # SSH into server or use migration tool
   cd backend
   python -c "from app.database import engine, Base; from app.models import *; Base.metadata.create_all(bind=engine)"
   python generate_data.py  # Generate sample data
   ```

---

## 📊 Database Hosting Options

### 1. **Supabase** (Easiest)
- Free PostgreSQL hosting
- Auto-backups
- Built-in authentication
- [supabase.com](https://supabase.com)

### 2. **ElephantSQL** (Free Tier)
- 20MB free PostgreSQL
- Perfect for demo
- [elephantsql.com](https://elephantsql.com)

### 3. **Neon.tech** (Modern)
- Serverless PostgreSQL
- Generous free tier
- [neon.tech](https://neon.tech)

---

## 🚦 CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_BACKEND }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: |
          npm install -g vercel
          cd frontend
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 🎯 Recommended for Hackathon Demo

**Best Option**: **Railway.app** (Backend + Database) + **Vercel** (Frontend)

**Why?**:
- ✅ Fastest deployment (10-15 minutes)
- ✅ Free/cheap ($5 credit)
- ✅ Auto-SSL certificates
- ✅ Auto-deploys on git push
- ✅ Good performance
- ✅ Professional URLs

**Steps**:
1. Deploy database on Railway (2 min)
2. Deploy backend on Railway (5 min)
3. Deploy frontend on Vercel (3 min)
4. Test and done! (5 min)

---

## 🔐 Security Checklist

- [ ] Change SECRET_KEY to random 32+ character string
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS (auto with most platforms)
- [ ] Set CORS to specific domains (not *)
- [ ] Use strong database passwords
- [ ] Enable database backups
- [ ] Set up monitoring (Railway/Render have built-in)

---

## 📈 Post-Deployment

1. **Generate Data**:
   ```bash
   # SSH into backend or create script
   python generate_data.py
   ```

2. **Create Admin User**:
   - Register via UI
   - Or use API directly

3. **Test All Features**:
   - Patient dashboard
   - Hospital admin dashboard
   - Predictions
   - Alerts
   - Reports

4. **Monitor**:
   - Check logs for errors
   - Monitor database connections
   - Watch API response times

---

## 🎬 Demo URLs Format

After deployment, you'll have:
- **Frontend**: `https://hospital-predictor.vercel.app`
- **Backend**: `https://hospital-backend.up.railway.app`
- **Database**: Managed by Railway/Render

Share these links with judges!

---

## 💡 Quick Commands Reference

### Railway CLI
```bash
railway login
railway init
railway up
railway logs
```

### Render
```bash
# No CLI needed - use web dashboard
```

### Vercel CLI
```bash
vercel login
vercel --prod
vercel logs
```

---

## 🆘 Troubleshooting

**Issue**: Database connection failed
- Check DATABASE_URL format: `postgresql://user:pass@host:5432/dbname`
- Ensure database allows connections from your backend IP

**Issue**: CORS errors
- Add frontend domain to CORS origins in `main.py`
- Restart backend after changes

**Issue**: Build fails
- Check Python version (3.12)
- Ensure all dependencies in requirements.txt
- Check Node version (18+)

**Issue**: 502 Bad Gateway
- Check backend is running: `curl https://your-backend.com/`
- Check logs for startup errors
- Verify PORT environment variable

---

## 📞 Support

For hackathon help:
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Render Community: [community.render.com](https://community.render.com)
- Vercel Discord: [vercel.com/discord](https://vercel.com/discord)

---

**Total Deployment Time**: 15-30 minutes depending on platform choice

**Recommended for 6-hour hackathon**: Railway + Vercel (fastest)
