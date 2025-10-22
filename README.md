# Air Quality Forecaster - Web Version

## 🌐 Live Demo Application

This is a lightweight, JavaScript-based version of the Air Quality Forecaster that runs entirely in the browser. Perfect for GitHub Pages deployment!

## 🆕 Latest Updates

- ✅ **Separate GRU Model**: Dedicated `gru_predictor.js` file with GRU neural network implementation
- ✅ **Fixed Forecast Chart**: Now displays predictions correctly
- ✅ **Dataset Upload**: Upload your own CSV files for analysis
- ✅ **Enhanced Interactivity**: More responsive and feature-rich
- ✅ **Sample Data**: Includes `sample_data.csv` for testing

## 📁 Files

- **index.html** - Main HTML structure
- **styles.css** - Complete styling and responsive design
- **app.js** - Main application logic and UI interactions
- **gru_predictor.js** - GRU neural network predictor model
- **sample_data.csv** - Sample dataset for testing upload feature
- **README.md** - This file
- **DEPLOYMENT_GUIDE.md** - Deployment instructions
- **QUICK_SUMMARY.md** - Quick reference

## ✨ Features

### 1. Current Air Quality Display
- Real-time AQI (Air Quality Index)
- PM2.5 concentration
- Color-coded health categories
- Last update timestamp

### 2. 24-Hour Forecast
- One-click forecast generation
- Interactive chart visualization
- Forecast statistics (average, peak, minimum)
- GRU-inspired prediction algorithm

### 3. Historical Data Visualization
- Multiple time ranges (24h, 3d, 7d, 30d)
- Interactive line chart
- Smooth animations

### 4. Hourly Pattern Analysis
- Average PM2.5 by hour of day
- Bar chart visualization
- Identifies peak pollution hours

### 5. Model Information
- GRU architecture details
- Feature engineering explanation
- Educational content

### 6. Dataset Upload (NEW!)
- Upload custom CSV files
- Automatic data validation
- Dataset statistics display
- Use uploaded data for predictions
- Supports multiple CSV formats

## 🚀 How to Run

### Option 1: Local (Instant)
1. Simply open `index.html` in any web browser
2. No installation or server required!

### Option 2: GitHub Pages (For Sharing)
1. Create a new GitHub repository
2. Upload these 4 files to the repository
3. Go to Settings → Pages
4. Select "main" branch as source
5. Your app will be live at: `https://[username].github.io/[repo-name]/`

### Option 3: Local Server (Optional)
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Then open: http://localhost:8000
```

## 🎯 How It Works

### Data Generation
- Simulates 30 days of historical air quality data
- Uses realistic patterns:
  - Daily cycles (higher during rush hours)
  - Weekly patterns (lower on weekends)
  - Monthly variations
  - Random pollution events

### Forecast Algorithm
The app uses a GRU-inspired prediction approach:
1. **Pattern Recognition**: Analyzes hourly patterns
2. **Trend Analysis**: Calculates recent trends
3. **Momentum**: Considers recent changes
4. **Noise**: Adds realistic variation
5. **Constraints**: Keeps values within realistic bounds

### AQI Calculation
Converts PM2.5 values to AQI using EPA standards:
- **0-50**: Good (Green)
- **51-100**: Moderate (Yellow)
- **101-150**: Unhealthy for Sensitive Groups (Orange)
- **151-200**: Unhealthy (Red)
- **201-300**: Very Unhealthy (Purple)
- **301+**: Hazardous (Maroon)

## 🎨 Customization

### Change Colors
Edit `styles.css` root variables:
```css
:root {
    --primary: #4a90e2;  /* Main color */
    --bg: #f0f2f5;       /* Background */
    /* ... */
}
```

### Adjust Forecast Parameters
Edit `app.js` CONFIG object:
```javascript
const CONFIG = {
    SEQUENCE_LENGTH: 24,    // Hours of data to analyze
    FORECAST_HOURS: 24,     // Hours to predict
    UPDATE_INTERVAL: 60000  // Auto-update interval (ms)
};
```

### Modify Data Patterns
Edit the `generateHistoricalData()` function in `app.js`

## 📊 Technologies Used

- **HTML5**: Structure
- **CSS3**: Styling with modern features
- **JavaScript (ES6+)**: Logic and interactivity
- **Chart.js**: Data visualization
- **No frameworks**: Pure vanilla JavaScript!

## 🌟 Advantages of This Version

✅ **No Backend Required**: Runs entirely in browser
✅ **No Installation**: Just open the HTML file
✅ **Fast Loading**: Lightweight (< 100KB total)
✅ **GitHub Pages Ready**: Deploy in 2 minutes
✅ **Mobile Responsive**: Works on all devices
✅ **Offline Capable**: Works without internet (after first load)
✅ **No Dependencies**: Only Chart.js CDN

## 📱 Responsive Design

- Desktop: Full layout with all features
- Tablet: Optimized layout
- Mobile: Single column, touch-friendly

## 🔄 Auto-Update Feature

The app automatically:
- Generates new data points every minute
- Updates all charts
- Maintains 30-day history
- Refreshes current status

## 🎓 Educational Value

Perfect for demonstrating:
- Time-series forecasting concepts
- GRU/RNN prediction patterns
- Data visualization techniques
- Responsive web design
- JavaScript programming

## 📝 For Your Project Submission

### What to Include:
1. **GitHub Repository Link**: Share the live demo
2. **Screenshots**: Capture all features
3. **Documentation**: This README
4. **Code Comments**: Well-documented code

### Deployment Steps:
```bash
# 1. Create repository
git init
git add .
git commit -m "Initial commit: Air Quality Forecaster"

# 2. Push to GitHub
git remote add origin [your-repo-url]
git push -u origin main

# 3. Enable GitHub Pages in repository settings
```

## 🆚 Comparison with Python Version

| Feature | Python/Streamlit | JavaScript/Web |
|---------|-----------------|----------------|
| Setup | Requires installation | Just open HTML |
| Deployment | Streamlit Cloud | GitHub Pages |
| Speed | 2-5 min training | Instant |
| Model | Real TensorFlow GRU | Simulated patterns |
| Data | Real CSV processing | Generated data |
| Best For | Actual ML training | Quick demos |

## 🔮 Future Enhancements

Possible additions:
- Real API integration (OpenWeatherMap, etc.)
- TensorFlow.js for real ML
- Data export functionality
- Multiple city comparison
- Weather data integration
- Alert notifications

## 📞 Support

For questions:
1. Check code comments in `app.js`
2. Review Chart.js documentation
3. Test in browser console for debugging

## 📄 License

Free to use for educational purposes.

---

**Status**: ✅ Ready to Deploy

**Perfect for**: Quick demos, GitHub Pages, project submissions

**No installation required** - Just open and run! 🚀
