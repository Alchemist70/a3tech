# Alchemist Research Website

A comprehensive educational website showcasing cutting-edge AI research projects in federated learning, biomarker discovery, and intelligent transportation systems. Built with React.js, Express.js, and MongoDB Atlas.

## 🚀 Features

### Educational Content
- **Multi-level Learning**: Content tailored for beginners, intermediate, and advanced audiences
- **Interactive Project Showcase**: Detailed project descriptions with technical specifications
- **Research Publications**: Integration with academic papers and publications
- **Visual Learning**: Diagrams, code snippets, and multimedia content

### Technical Features
- **Responsive Design**: Mobile-first approach with Material-UI components
- **Modern UI/UX**: Smooth animations and intuitive navigation
- **Search & Filter**: Advanced project discovery and categorization
- **Contact System**: Integrated contact form with inquiry categorization
- **Admin Panel**: Content management capabilities (to be implemented)

### Research Projects

#### 1. Federated Learning for Cancer Diagnosis
- **Focus**: Privacy-preserving collaborative AI for healthcare
- **Technologies**: PyTorch, Federated Learning, Differential Privacy
- **Impact**: 40% faster convergence, 15% improvement in cross-institution generalization
- **Educational Levels**: Beginner to Advanced explanations

#### 2. Multi-Omics Biomarker Discovery
- **Focus**: Explainable AI for precision medicine
- **Technologies**: Graph Neural Networks, Large Language Models, Multi-omics Integration
- **Impact**: Improved AUROC/AUPRC, better calibration and explanation quality
- **Educational Levels**: Beginner to Advanced explanations

#### 3. SDV Security Framework
- **Focus**: Multi-modal authentication for Software Defined Vehicles
- **Technologies**: Computer Vision, Facial Recognition, Gesture Control
- **Impact**: Real-time processing, enhanced security and usability
- **Educational Levels**: Beginner to Advanced explanations

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI)** for component library
- **React Router** for navigation
- **Framer Motion** for animations
- **Axios** for API calls

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Helmet** for security
- **Rate limiting** for API protection

### Database
- **MongoDB Atlas** for cloud database
- **Mongoose** for data modeling
- **Indexed search** for project discovery

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd alchemistwebsite
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/alchemist-research?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Database Seeding
```bash
cd backend
npm run seed
```

### 5. Start Development Servers

Backend (Terminal 1):
```bash
cd backend
npm run dev
```

Frontend (Terminal 2):
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🏗️ Project Structure

```
alchemistwebsite/
├── frontend/                 # React frontend application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Utility functions
│   │   └── App.tsx         # Main application component
│   └── package.json
├── backend/                 # Express.js backend API
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── utils/          # Utility functions
│   │   └── server.ts       # Main server file
│   └── package.json
└── README.md
```

## 🎯 Key Features Explained

### Educational Content System
The website implements a sophisticated educational content system that adapts to different user backgrounds:

- **Beginner Level**: Simple explanations with real-world analogies
- **Intermediate Level**: Technical details with methodology explanations
- **Advanced Level**: Implementation details, performance metrics, and research contributions

### Project Showcase
Each project includes:
- Comprehensive descriptions at multiple complexity levels
- Technical specifications and methodologies
- Publication information and research contributions
- Media resources (images, videos, code snippets)
- Interactive learning materials

### Search & Discovery
- Full-text search across project content
- Category-based filtering
- Tag-based organization
- Pagination for large result sets

## 🔧 API Endpoints

### Projects
- `GET /api/projects` - Get all projects with filtering
- `GET /api/projects/featured` - Get featured projects
- `GET /api/projects/:id` - Get project by ID
- `GET /api/projects/:id/content` - Get project content by educational level
- `GET /api/projects/category/:category` - Get projects by category

### Contact
- `POST /api/contact` - Submit contact form
- `GET /api/contact` - Get contact messages (admin)
- `PUT /api/contact/:id` - Update contact status (admin)

### Health
- `GET /api/health` - Health check endpoint

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
1. Build the frontend: `npm run build`
2. Deploy the `build` folder to your hosting service
3. Set environment variables for API URL

### Backend Deployment (Heroku/Railway)
1. Set up MongoDB Atlas database
2. Configure environment variables
3. Deploy the backend application
4. Update frontend API URL

### Environment Variables
```env
# Production
NODE_ENV=production
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
FRONTEND_URL=https://your-frontend-domain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Abdulhadi Abbas Akanni**
- Email: aabdulha@gitam.in
- Institution: GITAM University, Bengaluru
- Lab: SDV-MURTI Lab

## 🙏 Acknowledgments

- GITAM University for research support
- SDV-MURTI Lab for resources and collaboration
- Open source community for amazing tools and libraries

## 📞 Contact

For questions, collaborations, or feedback, please reach out through:
- Email: aabdulha@gitam.in
- Contact form on the website
- GitHub issues for technical discussions

---

**Note**: This website is designed to showcase research projects for academic and professional purposes. The content is tailored to be accessible to audiences with varying technical backgrounds while maintaining scientific accuracy and rigor.
