# Frontend Quick Start Guide

## 🚀 Getting Started in 3 Steps

### 1. Install Dependencies
```bash
cd /home/runner/work/gym/gym/frontend
npm install
```

### 2. Configure Environment
Already configured in `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start Development Server
```bash
npm run dev
```

The app will be available at: **http://localhost:3000**

## 📋 Demo Login
```
Email: admin@gym.com
Password: admin123
```

## 🏗️ Project Structure
```
frontend/
├── src/
│   ├── components/      # React components
│   │   ├── Auth/       # Login
│   │   ├── Dashboard/  # Main dashboard
│   │   └── Layout/     # Layout components
│   ├── contexts/       # React contexts (Auth)
│   ├── hooks/          # Custom hooks
│   ├── services/       # API services
│   └── utils/          # Utilities (formatters, validators)
├── index.html          # Entry HTML
├── vite.config.js      # Vite config
└── tailwind.config.js  # Tailwind config
```

## 🎨 Available Routes
- `/login` - Login page
- `/dashboard` - Main dashboard (protected)
- More routes can be added in `src/App.jsx`

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## 🔌 API Integration

The app is configured to proxy API requests to the backend:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`

All API calls go through `src/services/api.js` which handles:
- ✅ JWT authentication
- ✅ Automatic token injection
- ✅ Error handling
- ✅ Auto-redirect on 401

## 📚 Key Technologies
- **React 18** - UI library
- **Vite** - Build tool (fast!)
- **TailwindCSS** - Styling
- **React Router** - Routing
- **Axios** - HTTP client
- **Recharts** - Charts

## ✅ What's Already Built
- ✅ Login system with JWT
- ✅ Protected routes
- ✅ Dashboard with metrics
- ✅ Income chart
- ✅ Alerts widget
- ✅ Responsive layout
- ✅ Toast notifications
- ✅ API service layer

## 🎯 Next Steps
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm run dev`
3. Open browser: `http://localhost:3000`
4. Login and explore!

## 🐛 Troubleshooting

**Port already in use?**
```bash
# Kill process on port 3000
npx kill-port 3000
```

**Build errors?**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

**API connection issues?**
- Check backend is running on port 5000
- Verify `.env` has correct API URL
- Check browser console for errors

## 📖 Documentation
See `frontend/README.md` for complete documentation.

---
**Ready to code? Happy building! 🎉**
