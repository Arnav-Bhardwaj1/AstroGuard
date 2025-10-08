# AstroGuard: Earth's Sentinel 🛡️

An interactive asteroid impact visualization tool that allows users to simulate asteroid impacts and test deflection strategies using real NASA data.

## 🌟 Features

- **Real Asteroid Data**: Uses NASA's Sentry API to get current Potentially Hazardous Asteroids
- **3D Visualization**: Interactive 3D trajectory visualization using Three.js
- **Impact Simulation**: Calculate impact energy, crater size, and tsunami risk
- **Deflection Testing**: Apply velocity changes to test asteroid deflection strategies
- **Educational**: Learn about orbital mechanics and planetary defense

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ 
- Node.js 16+
- npm or yarn

### Automated Setup

**Windows:**
```cmd
setup.bat
```

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

### Manual Setup

#### Backend Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
python app.py
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🛠️ Tech Stack

- **Backend**: Python Flask with physics calculations
- **Frontend**: React with TypeScript
- **3D Graphics**: Three.js with react-three-fiber
- **Maps**: Leaflet for 2D world visualization
- **Styling**: Tailwind CSS
- **APIs**: NASA JPL, USGS

## 📡 APIs Used

- **NASA Sentry API**: For potentially hazardous asteroid data
- **JPL SBDB API**: For detailed orbital parameters
- **USGS Elevation API**: For terrain data and tsunami risk assessment

## 🎮 How to Use

1. **Select an Asteroid**: Choose from real potentially hazardous asteroids
2. **Set Impact Location**: Click on the map or enter coordinates
3. **Simulate Impact**: See the calculated effects and 3D trajectory
4. **Test Deflection**: Use the slider to apply velocity changes and see the new trajectory
5. **Analyze Results**: View detailed impact analysis including crater size, tsunami risk, and more

## 🏗️ Project Structure

```
AstroGuard/
├── backend/
│   ├── app.py              # Flask API server
│   ├── physics.py          # Impact calculations and orbital mechanics
│   ├── requirements.txt    # Python dependencies
│   └── data/              # Cached API responses
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── ControlPanel.tsx
│   │   │   ├── ThreeScene.tsx
│   │   │   ├── MapView.tsx
│   │   │   └── ResultsDisplay.tsx
│   │   ├── utils/         # Utility functions
│   │   ├── types/         # TypeScript definitions
│   │   └── App.tsx
│   ├── public/
│   └── package.json
├── setup.bat              # Windows setup script
├── setup.sh               # Linux/Mac setup script
└── README.md
```

## 🔬 Physics Engine

The application includes a comprehensive physics engine that calculates:

- **Kinetic Energy**: Based on asteroid mass and velocity
- **Crater Scaling**: Using Holsapple-Schmidt scaling laws
- **Orbital Mechanics**: Keplerian element calculations
- **Deflection Physics**: Velocity change effects on trajectories
- **Impact Effects**: Tsunami risk, seismic magnitude, fireball radius

## 🎯 Educational Features

- **Interactive Learning**: Hover over technical terms for explanations
- **Real Data**: Uses actual NASA asteroid data
- **Visual Feedback**: 3D trajectories and 2D impact zones
- **Mission Mode**: Gamified "Defend Earth" experience
- **Impact Context**: Compares impacts to historical events

## 🚀 Deployment

### Backend (Flask)
- **Render**: Connect GitHub repo and deploy
- **Heroku**: Use Procfile and requirements.txt
- **Railway**: Direct deployment from GitHub

### Frontend (React)
- **Vercel**: `npm run build` and deploy
- **Netlify**: Connect GitHub repo
- **GitHub Pages**: Use GitHub Actions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- NASA JPL for asteroid data APIs
- USGS for elevation data
- Three.js community for 3D graphics
- React and TypeScript communities