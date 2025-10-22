// Air Quality Forecaster - Main Application
// Integrated with GRU Predictor Model

// Configuration
const CONFIG = {
    SEQUENCE_LENGTH: 24,
    FORECAST_HOURS: 24,
    UPDATE_INTERVAL: 60000, // 1 minute
    AQI_CATEGORIES: [
        { max: 50, label: 'Good', color: '#4CAF50', class: 'aqi-good' },
        { max: 100, label: 'Moderate', color: '#FFC107', class: 'aqi-moderate' },
        { max: 150, label: 'Unhealthy for Sensitive Groups', color: '#FF9800', class: 'aqi-unhealthy-sensitive' },
        { max: 200, label: 'Unhealthy', color: '#F44336', class: 'aqi-unhealthy' },
        { max: 300, label: 'Very Unhealthy', color: '#9C27B0', class: 'aqi-very-unhealthy' },
        { max: Infinity, label: 'Hazardous', color: '#795548', class: 'aqi-hazardous' }
    ]
};

// Initialize GRU Predictor
const gruPredictor = new GRUPredictor({
    sequenceLength: CONFIG.SEQUENCE_LENGTH,
    hiddenUnits: [64, 32],
    dropoutRate: 0.2,
    learningRate: 0.001
});

// Global state
const state = {
    historicalData: [],
    uploadedData: null,
    uploadedMetadata: null, // Store extra columns
    forecastData: null,
    extendedForecastData: null,
    activeDataset: 'default', // 'default' or 'uploaded'
    charts: {
        forecast: null,
        history: null,
        hourly: null,
        country: null,
        extendedForecast: null,
        riskTimeline: null
    }
};

// DOM Elements
const elements = {
    currentAqi: document.getElementById('current-aqi'),
    aqiCategory: document.getElementById('aqi-category'),
    pm25Value: document.getElementById('pm25-value'),
    lastUpdated: document.getElementById('last-updated'),
    extraMetadata: document.getElementById('extra-metadata'),
    predictBtn: document.getElementById('predict-btn'),
    timeRangeSelect: document.getElementById('time-range'),
    forecastStats: document.getElementById('forecast-stats'),
    forecastAvg: document.getElementById('forecast-avg'),
    forecastPeak: document.getElementById('forecast-peak'),
    forecastMin: document.getElementById('forecast-min'),
    uploadBtn: document.getElementById('upload-btn'),
    fileUpload: document.getElementById('file-upload'),
    uploadStatus: document.getElementById('upload-status'),
    datasetInfo: document.getElementById('dataset-info'),
    useDatasetBtn: document.getElementById('use-dataset-btn'),
    datasetSwitcher: document.getElementById('dataset-switcher'),
    useDefaultBtn: document.getElementById('use-default-btn'),
    useUploadedBtn: document.getElementById('use-uploaded-btn'),
    datasetSourceInfo: document.getElementById('dataset-source-info'),
    datasetTitle: document.getElementById('dataset-title'),
    countryAnalysis: document.getElementById('country-analysis'),
    countryStats: document.getElementById('country-stats'),
    extendedForecast: document.getElementById('extended-forecast'),
    extendedPredictBtn: document.getElementById('extended-predict-btn'),
    forecastDays: document.getElementById('forecast-days'),
    extendedForecastSummary: document.getElementById('extended-forecast-summary'),
    // Business value elements
    healthRiskLevel: document.getElementById('health-risk-level'),
    healthAlertCount: document.getElementById('health-alert-count'),
    costSavings: document.getElementById('cost-savings'),
    efficiencyScore: document.getElementById('efficiency-score'),
    optimalHours: document.getElementById('optimal-hours'),
    riskScore: document.getElementById('risk-score'),
    warningHours: document.getElementById('warning-hours'),
    calculateRoiBtn: document.getElementById('calculate-roi-btn'),
    populationInput: document.getElementById('population-input'),
    healthcareCostInput: document.getElementById('healthcare-cost-input'),
    preventionRateInput: document.getElementById('prevention-rate-input'),
    roiResults: document.getElementById('roi-results'),
    annualSavings: document.getElementById('annual-savings'),
    preventedIncidents: document.getElementById('prevented-incidents'),
    roiMultiple: document.getElementById('roi-multiple'),
    healthAdvisory: document.getElementById('health-advisory'),
    currentRiskAdvisory: document.getElementById('current-risk-advisory'),
    recommendedActions: document.getElementById('recommended-actions'),
    vulnerableGroups: document.getElementById('vulnerable-groups')
};

// Initialize the application
function init() {
    console.log('Initializing Air Quality Forecaster...');
    
    // Generate initial historical data
    state.historicalData = generateHistoricalData(720); // 30 days
    
    // Update current status
    updateCurrentStatus();
    
    // Initialize charts
    initializeCharts();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update displays
    updateHistoryChart();
    updateHourlyChart();
    
    // Initialize business metrics (with default values)
    updateBusinessMetrics();
    
    console.log('Application initialized successfully!');
}

// Set up event listeners
function setupEventListeners() {
    elements.predictBtn.addEventListener('click', handleForecastGeneration);
    elements.timeRangeSelect.addEventListener('change', updateHistoryChart);
    elements.uploadBtn.addEventListener('click', () => elements.fileUpload.click());
    elements.fileUpload.addEventListener('change', handleFileUpload);
    elements.useDatasetBtn.addEventListener('click', useUploadedDataset);
    
    // Dataset switcher
    if (elements.useDefaultBtn) {
        elements.useDefaultBtn.addEventListener('click', () => switchDataset('default'));
    }
    if (elements.useUploadedBtn) {
        elements.useUploadedBtn.addEventListener('click', () => switchDataset('uploaded'));
    }
    
    // Extended forecast
    if (elements.extendedPredictBtn) {
        elements.extendedPredictBtn.addEventListener('click', handleExtendedForecast);
    }
    
    // Business value - ROI Calculator
    if (elements.calculateRoiBtn) {
        elements.calculateRoiBtn.addEventListener('click', calculateROI);
    }
}

// Update current air quality status
function updateCurrentStatus() {
    const latestData = state.historicalData[state.historicalData.length - 1];
    const aqi = pm25ToAqi(latestData.pm25);
    const category = getAqiCategory(aqi);
    
    // Update values
    elements.currentAqi.textContent = aqi;
    elements.pm25Value.textContent = `PM2.5: ${latestData.pm25.toFixed(1)} µg/m³`;
    elements.aqiCategory.textContent = category.label;
    elements.lastUpdated.textContent = `Last updated: ${new Date(latestData.timestamp).toLocaleTimeString()}`;
    
    // Update colors
    elements.currentAqi.className = `aqi-value ${category.class}`;
    elements.aqiCategory.className = `aqi-category ${category.class}`;
    
    // Hide extra metadata - country info shown in Country-wise Analysis section instead
    elements.extraMetadata.style.display = 'none';
}

// Display extra metadata from uploaded dataset
// REMOVED: Metadata now shown in Country-wise Analysis section instead
// function displayExtraMetadata(metadata) { ... }

// Initialize all charts
function initializeCharts() {
    initForecastChart();
    initHistoryChart();
    initHourlyChart();
}

// Initialize forecast chart
function initForecastChart() {
    const ctx = document.getElementById('forecast-chart').getContext('2d');
    
    state.charts.forecast = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'PM2.5 Forecast (µg/m³)',
                data: [],
                borderColor: '#e67e22',
                backgroundColor: 'rgba(230, 126, 34, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            const pm25 = context.parsed.y.toFixed(1);
                            const aqi = pm25ToAqi(parseFloat(pm25));
                            return `PM2.5: ${pm25} µg/m³ (AQI: ${aqi})`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Hour',
                        font: { size: 14, weight: 'bold' }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'PM2.5 (µg/m³)',
                        font: { size: 14, weight: 'bold' }
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// Initialize history chart
function initHistoryChart() {
    const ctx = document.getElementById('history-chart').getContext('2d');
    
    state.charts.history = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'PM2.5 (µg/m³)',
                data: [],
                borderColor: '#4a90e2',
                backgroundColor: 'rgba(74, 144, 226, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 2,
                pointHoverRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time',
                        font: { size: 14, weight: 'bold' }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'PM2.5 (µg/m³)',
                        font: { size: 14, weight: 'bold' }
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// Initialize hourly pattern chart
function initHourlyChart() {
    const ctx = document.getElementById('hourly-chart').getContext('2d');
    
    state.charts.hourly = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Array.from({length: 24}, (_, i) => `${i}:00`),
            datasets: [{
                label: 'Average PM2.5 by Hour',
                data: [],
                backgroundColor: 'rgba(74, 144, 226, 0.6)',
                borderColor: '#4a90e2',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Hour of Day',
                        font: { size: 14, weight: 'bold' }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Average PM2.5 (µg/m³)',
                        font: { size: 14, weight: 'bold' }
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// Update history chart based on selected time range
function updateHistoryChart() {
    const hours = parseInt(elements.timeRangeSelect.value);
    const data = state.historicalData.slice(-hours);
    
    const labels = data.map(entry => {
        const date = new Date(entry.timestamp);
        if (hours <= 24) {
            return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        } else if (hours <= 168) {
            return date.toLocaleDateString([], {month: 'short', day: 'numeric', hour: '2-digit'});
        } else {
            return date.toLocaleDateString([], {month: 'short', day: 'numeric'});
        }
    });
    
    const pm25Data = data.map(entry => entry.pm25);
    
    state.charts.history.data.labels = labels;
    state.charts.history.data.datasets[0].data = pm25Data;
    state.charts.history.update();
}

// Update hourly pattern chart
function updateHourlyChart() {
    const hourlyAverages = calculateHourlyAverages();
    
    state.charts.hourly.data.datasets[0].data = hourlyAverages;
    state.charts.hourly.update();
}

// Calculate average PM2.5 by hour of day
function calculateHourlyAverages() {
    const hourlyData = Array(24).fill(0).map(() => ({ sum: 0, count: 0 }));
    
    state.historicalData.forEach(entry => {
        const date = new Date(entry.timestamp);
        const hour = date.getHours();
        
        // Debug: Log first few entries
        if (hourlyData[hour].count < 2) {
            console.log(`Hour ${hour}: PM2.5 = ${entry.pm25}, Timestamp = ${entry.timestamp}`);
        }
        
        hourlyData[hour].sum += entry.pm25;
        hourlyData[hour].count++;
    });
    
    // Log summary
    console.log('Hourly data summary:', hourlyData.map((d, i) => `${i}:00 = ${d.count} records`).filter((_, i) => hourlyData[i].count > 0));
    
    return hourlyData.map(data => 
        data.count > 0 ? parseFloat((data.sum / data.count).toFixed(1)) : 0
    );
}

// Handle forecast generation
async function handleForecastGeneration() {
    // Disable button and show loading state
    elements.predictBtn.disabled = true;
    elements.predictBtn.querySelector('.btn-text').style.display = 'none';
    elements.predictBtn.querySelector('.btn-loader').style.display = 'inline';
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate forecast using GRU predictor
    const forecast = gruPredictor.forecast(state.historicalData, CONFIG.FORECAST_HOURS);
    state.forecastData = forecast;
    
    console.log('Forecast generated:', forecast.length, 'hours');
    
    // Update forecast chart
    updateForecastChart(forecast);
    
    // Show forecast statistics
    showForecastStatistics(forecast);
    
    // Update business value metrics
    updateBusinessMetrics();
    
    // Show extended forecast section
    elements.extendedForecast.style.display = 'block';
    
    // Re-enable button
    elements.predictBtn.disabled = false;
    elements.predictBtn.querySelector('.btn-text').style.display = 'inline';
    elements.predictBtn.querySelector('.btn-loader').style.display = 'none';
}

// Update forecast chart with new data
function updateForecastChart(forecast) {
    const now = new Date();
    const labels = forecast.map((_, i) => {
        const date = new Date(now);
        date.setHours(date.getHours() + i + 1);
        return date.toLocaleTimeString([], {hour: '2-digit', hour12: true});
    });
    
    state.charts.forecast.data.labels = labels;
    state.charts.forecast.data.datasets[0].data = forecast;
    state.charts.forecast.update();
}

// Show forecast statistics
function showForecastStatistics(forecast) {
    const avg = (forecast.reduce((a, b) => a + b, 0) / forecast.length).toFixed(1);
    const peak = Math.max(...forecast).toFixed(1);
    const min = Math.min(...forecast).toFixed(1);
    
    elements.forecastAvg.textContent = `${avg} µg/m³`;
    elements.forecastPeak.textContent = `${peak} µg/m³`;
    elements.forecastMin.textContent = `${min} µg/m³`;
    
    elements.forecastStats.style.display = 'flex';
}

// Generate forecast using GRU-like pattern
function generateForecast() {
    const recentData = state.historicalData.slice(-CONFIG.SEQUENCE_LENGTH);
    const currentPm25 = recentData[recentData.length - 1].pm25;
    
    const forecast = [];
    let prevValue = currentPm25;
    
    for (let i = 0; i < CONFIG.FORECAST_HOURS; i++) {
        const hour = (new Date().getHours() + i + 1) % 24;
        
        // Simulate GRU-like prediction with patterns
        const hourlyPattern = Math.sin((hour - 6) / 24 * Math.PI * 2) * 8;
        const trend = calculateTrend(recentData);
        const momentum = (prevValue - currentPm25) * 0.3;
        const noise = (Math.random() - 0.5) * 5;
        
        let prediction = prevValue + hourlyPattern * 0.3 + trend + momentum + noise;
        
        // Add occasional spikes (simulating real-world events)
        if (Math.random() > 0.92) {
            prediction += Math.random() * 20;
        }
        
        // Keep values realistic
        prediction = Math.max(5, Math.min(250, prediction));
        
        forecast.push(parseFloat(prediction.toFixed(1)));
        prevValue = prediction;
    }
    
    return forecast;
}

// Calculate trend from recent data
function calculateTrend(data) {
    if (data.length < 2) return 0;
    
    const recent = data.slice(-6);
    const older = data.slice(-12, -6);
    
    const recentAvg = recent.reduce((a, b) => a + b.pm25, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b.pm25, 0) / older.length;
    
    return (recentAvg - olderAvg) * 0.1;
}

// Generate historical data
function generateHistoricalData(hours) {
    const data = [];
    const now = new Date();
    
    for (let i = hours; i >= 0; i--) {
        const timestamp = new Date(now);
        timestamp.setHours(timestamp.getHours() - i);
        
        const hour = timestamp.getHours();
        const dayOfWeek = timestamp.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const dayOfMonth = timestamp.getDate();
        
        // Complex pattern simulation
        let pm25 = 25; // Base value
        
        // Daily pattern (higher during rush hours)
        pm25 += Math.sin((hour - 6) / 24 * Math.PI * 2) * 15;
        
        // Rush hour spikes
        if (hour >= 7 && hour <= 9) pm25 += 10;
        if (hour >= 17 && hour <= 19) pm25 += 12;
        
        // Weekend effect (slightly lower)
        if (isWeekend) pm25 -= 5;
        
        // Monthly variation
        pm25 += Math.sin(dayOfMonth / 30 * Math.PI * 2) * 8;
        
        // Random noise
        pm25 += (Math.random() * 10 - 5);
        
        // Occasional pollution events
        if (Math.random() > 0.95) {
            pm25 += 30 + Math.random() * 50;
        }
        
        // Keep values realistic
        pm25 = Math.max(5, Math.min(250, pm25));
        
        data.push({
            timestamp: timestamp.toISOString(),
            pm25: parseFloat(pm25.toFixed(1))
        });
    }
    
    return data;
}

// Convert PM2.5 to AQI
function pm25ToAqi(pm25) {
    // Simplified AQI calculation
    if (pm25 <= 12.0) return Math.round(pm25 * 50 / 12.0);
    if (pm25 <= 35.4) return Math.round(50 + (pm25 - 12.0) * 50 / 23.4);
    if (pm25 <= 55.4) return Math.round(100 + (pm25 - 35.4) * 50 / 20.0);
    if (pm25 <= 150.4) return Math.round(150 + (pm25 - 55.4) * 50 / 95.0);
    if (pm25 <= 250.4) return Math.round(200 + (pm25 - 150.4) * 100 / 100.0);
    return Math.round(300 + (pm25 - 250.4) * 100 / 99.6);
}

// Get AQI category information
function getAqiCategory(aqi) {
    return CONFIG.AQI_CATEGORIES.find(cat => aqi <= cat.max);
}

// Handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Show processing status
    elements.uploadStatus.textContent = '⏳ Processing file...';
    elements.uploadStatus.className = 'upload-status processing';
    elements.uploadStatus.style.display = 'block';
    
    // Parse CSV file
    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        delimiter: ',', // Force comma as delimiter
        newline: '', // Auto-detect line endings
        quoteChar: '"',
        escapeChar: '"',
        complete: function(results) {
            try {
                const parsedData = processUploadedData(results.data);
                state.uploadedData = parsedData;
                
                // Show success message
                elements.uploadStatus.textContent = `✅ Successfully loaded ${parsedData.length} records!`;
                elements.uploadStatus.className = 'upload-status success';
                
                // Display dataset information
                displayDatasetInfo(parsedData);
                
            } catch (error) {
                elements.uploadStatus.textContent = `❌ Error: ${error.message}`;
                elements.uploadStatus.className = 'upload-status error';
                console.error('Upload error:', error);
            }
        },
        error: function(error) {
            elements.uploadStatus.textContent = `❌ Error parsing file: ${error.message}`;
            elements.uploadStatus.className = 'upload-status error';
        }
    });
}

// Process uploaded CSV data
function processUploadedData(rawData) {
    console.log('Raw data received:', rawData.length, 'rows');
    console.log('First row sample:', rawData[0]);
    console.log('Column names:', Object.keys(rawData[0] || {}));
    
    const processedData = [];
    let skippedRows = 0;
    
    for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        
        // Try different possible column names (case-insensitive)
        let timestamp = null;
        let pm25 = null;
        
        // Find timestamp column
        for (let key in row) {
            const lowerKey = key.toLowerCase().trim();
            if (lowerKey.includes('timestamp') || lowerKey.includes('date') || lowerKey.includes('time')) {
                timestamp = row[key];
                console.log(`Found timestamp in column "${key}":`, timestamp);
                break;
            }
        }
        
        // Find PM2.5 column
        for (let key in row) {
            const lowerKey = key.toLowerCase().trim();
            if (lowerKey.includes('pm') || lowerKey.includes('2.5') || lowerKey.includes('25') || 
                lowerKey.includes('aqi') || lowerKey.includes('pollution') || lowerKey.includes('quality')) {
                pm25 = row[key];
                console.log(`Found PM2.5/AQI in column "${key}":`, pm25);
                break;
            }
        }
        
        // Skip if missing data
        if (!timestamp || pm25 === undefined || pm25 === null || pm25 === '') {
            skippedRows++;
            if (i < 5) console.log(`Skipping row ${i}: timestamp=${timestamp}, pm25=${pm25}`);
            continue;
        }
        
        // Parse timestamp
        let parsedTimestamp;
        try {
            parsedTimestamp = new Date(timestamp);
            if (isNaN(parsedTimestamp.getTime())) {
                // Try alternative parsing
                const parts = timestamp.toString().split(/[\s,\/\-:]+/);
                if (parts.length >= 3) {
                    parsedTimestamp = new Date(parts.join(' '));
                }
                if (isNaN(parsedTimestamp.getTime())) {
                    skippedRows++;
                    if (i < 5) console.log(`Invalid date at row ${i}:`, timestamp);
                    continue;
                }
            }
        } catch (e) {
            skippedRows++;
            if (i < 5) console.log(`Error parsing date at row ${i}:`, e);
            continue;
        }
        
        // Parse PM2.5 value
        let parsedPm25 = parseFloat(pm25);
        if (isNaN(parsedPm25)) {
            // Try removing non-numeric characters
            const cleaned = pm25.toString().replace(/[^0-9.-]/g, '');
            parsedPm25 = parseFloat(cleaned);
        }
        
        if (isNaN(parsedPm25) || parsedPm25 < 0) {
            skippedRows++;
            if (i < 5) console.log(`Invalid PM2.5 at row ${i}:`, pm25);
            continue;
        }
        
        // Store extra columns as metadata
        const metadata = {};
        for (let key in row) {
            const lowerKey = key.toLowerCase().trim();
            // Skip timestamp and PM2.5 columns
            if (!lowerKey.includes('timestamp') && !lowerKey.includes('date') && !lowerKey.includes('time') &&
                !lowerKey.includes('pm') && !lowerKey.includes('2.5') && !lowerKey.includes('25') && 
                !lowerKey.includes('aqi') && !lowerKey.includes('pollution') && !lowerKey.includes('quality')) {
                if (row[key] !== null && row[key] !== undefined && row[key] !== '') {
                    metadata[key] = row[key];
                }
            }
        }
        
        processedData.push({
            timestamp: parsedTimestamp.toISOString(),
            pm25: parsedPm25,
            metadata: Object.keys(metadata).length > 0 ? metadata : null
        });
    }
    
    console.log(`Processed: ${processedData.length} valid rows, ${skippedRows} skipped`);
    
    if (processedData.length === 0) {
        // Show detailed error message
        let errorMsg = `No valid data found. Processed ${rawData.length} rows but none were valid.\n\n`;
        errorMsg += `Column names in your CSV: ${Object.keys(rawData[0] || {}).join(', ')}\n\n`;
        errorMsg += `Looking for:\n`;
        errorMsg += `- Date column: containing "date", "time", or "timestamp"\n`;
        errorMsg += `- PM2.5/AQI column: containing "pm", "2.5", "25", "aqi", "pollution", or "quality"\n\n`;
        errorMsg += `First row data: ${JSON.stringify(rawData[0])}\n\n`;
        errorMsg += `Check browser console (F12) for more details.`;
        
        console.error('ERROR: No valid data found');
        console.error('Your CSV columns:', Object.keys(rawData[0] || {}));
        console.error('First 3 rows:', rawData.slice(0, 3));
        
        throw new Error(errorMsg);
    }
    
    // Sort by timestamp
    processedData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    console.log('Successfully processed data:', processedData.length, 'records');
    console.log('Date range:', processedData[0].timestamp, 'to', processedData[processedData.length-1].timestamp);
    
    return processedData;
}

// Display dataset information
function displayDatasetInfo(data) {
    const pm25Values = data.map(d => d.pm25);
    const avgPm25 = (pm25Values.reduce((a, b) => a + b, 0) / pm25Values.length).toFixed(1);
    const maxPm25 = Math.max(...pm25Values).toFixed(1);
    
    const firstDate = new Date(data[0].timestamp).toLocaleDateString();
    const lastDate = new Date(data[data.length - 1].timestamp).toLocaleDateString();
    
    document.getElementById('dataset-records').textContent = data.length;
    document.getElementById('dataset-range').textContent = `${firstDate} - ${lastDate}`;
    document.getElementById('dataset-avg').textContent = `${avgPm25} µg/m³`;
    document.getElementById('dataset-max').textContent = `${maxPm25} µg/m³`;
    
    elements.datasetInfo.style.display = 'block';
}

// Use uploaded dataset
function useUploadedDataset() {
    if (!state.uploadedData) return;
    
    // Show dataset switcher
    elements.datasetSwitcher.style.display = 'block';
    
    // Switch to uploaded dataset
    switchDataset('uploaded');
    
    // Hide dataset info card
    elements.datasetInfo.style.display = 'none';
    
    // Show success message
    alert(`✅ Dataset loaded successfully! ${state.uploadedData.length} records available.\\n\\nUse the dataset switcher above to toggle between default and uploaded data.`);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Switch between datasets
function switchDataset(dataset) {
    state.activeDataset = dataset;
    
    if (dataset === 'default') {
        // Use default simulated data
        state.historicalData = generateHistoricalData(720);
        
        // Update button states
        elements.useDefaultBtn.classList.add('active');
        elements.useUploadedBtn.classList.remove('active');
        
        // Update dataset title
        elements.datasetTitle.innerHTML = '📍 Analyzing: Indian Air Quality Index (AQI) Dataset';
        
        // Update source info
        elements.datasetSourceInfo.innerHTML = `
            <strong>📊 Source:</strong> Simulated data with realistic patterns<br>
            <strong>📅 Records:</strong> ${state.historicalData.length} hours<br>
            <strong>🎯 Features:</strong> Daily cycles, rush hour patterns, weekend effects
        `;
        
        // Hide country analysis
        elements.countryAnalysis.style.display = 'none';
    } else if (dataset === 'uploaded' && state.uploadedData) {
        // Use uploaded data
        state.historicalData = state.uploadedData;
        
        // Update button states
        elements.useDefaultBtn.classList.remove('active');
        elements.useUploadedBtn.classList.add('active');
        
        // Update dataset title
        elements.datasetTitle.innerHTML = '🌍 Analyzing: World Countries Air Quality Dataset';
        
        // Get metadata info
        const hasMetadata = state.historicalData.some(d => d.metadata);
        const metadataKeys = hasMetadata ? 
            Object.keys(state.historicalData.find(d => d.metadata)?.metadata || {}).join(', ') : 
            'None';
        
        // Update source info
        const firstDate = new Date(state.historicalData[0].timestamp).toLocaleDateString();
        const lastDate = new Date(state.historicalData[state.historicalData.length - 1].timestamp).toLocaleDateString();
        
        elements.datasetSourceInfo.innerHTML = `
            <strong>📁 Source:</strong> Uploaded CSV file<br>
            <strong>📅 Records:</strong> ${state.historicalData.length} entries<br>
            <strong>📆 Date Range:</strong> ${firstDate} - ${lastDate}<br>
            <strong>📋 Extra Columns:</strong> ${metadataKeys}
        `;
        
        // Show country analysis if Country column exists
        const hasCountry = state.historicalData.some(d => d.metadata && d.metadata.Country);
        if (hasCountry) {
            displayCountryAnalysis();
        } else {
            elements.countryAnalysis.style.display = 'none';
        }
    }
    
    // Update all displays
    updateCurrentStatus();
    updateHistoryChart();
    updateHourlyChart();
    
    // Clear forecast
    if (state.charts.forecast) {
        state.charts.forecast.data.labels = [];
        state.charts.forecast.data.datasets[0].data = [];
        state.charts.forecast.update();
    }
    elements.forecastStats.style.display = 'none';
}

// Display country-wise analysis
function displayCountryAnalysis() {
    // Group data by country
    const countryData = {};
    
    state.historicalData.forEach(entry => {
        if (entry.metadata && entry.metadata.Country) {
            const country = entry.metadata.Country;
            if (!countryData[country]) {
                countryData[country] = {
                    values: [],
                    statuses: []
                };
            }
            countryData[country].values.push(entry.pm25);
            if (entry.metadata.Status) {
                countryData[country].statuses.push(entry.metadata.Status);
            }
        }
    });
    
    // Calculate statistics for each country
    const countryStats = {};
    for (let country in countryData) {
        const values = countryData[country].values;
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        const mostCommonStatus = countryData[country].statuses.length > 0 ?
            countryData[country].statuses.sort((a,b) =>
                countryData[country].statuses.filter(v => v === a).length -
                countryData[country].statuses.filter(v => v === b).length
            ).pop() : 'N/A';
        
        countryStats[country] = {
            avg: avg.toFixed(1),
            max: max.toFixed(1),
            min: min.toFixed(1),
            count: values.length,
            status: mostCommonStatus
        };
    }
    
    // Display country stats cards
    let statsHtml = '';
    const sortedCountries = Object.keys(countryStats).sort((a, b) => 
        countryStats[b].avg - countryStats[a].avg
    ).slice(0, 10); // Top 10 countries
    
    sortedCountries.forEach(country => {
        const stats = countryStats[country];
        const aqi = pm25ToAqi(parseFloat(stats.avg));
        const category = getAqiCategory(aqi);
        
        statsHtml += `
            <div class="country-stat-card">
                <div class="country-name">${country}</div>
                <div class="country-aqi ${category.class}">${aqi}</div>
                <div class="country-status" style="background-color: ${category.color}20; color: ${category.color};">
                    ${stats.status}
                </div>
                <div style="margin-top: 10px; font-size: 0.85rem; color: var(--text-light);">
                    Avg: ${stats.avg} µg/m³<br>
                    Records: ${stats.count}
                </div>
            </div>
        `;
    });
    
    elements.countryStats.innerHTML = statsHtml;
    
    // Create country comparison chart
    createCountryChart(sortedCountries, countryStats);
    
    // Show the section
    elements.countryAnalysis.style.display = 'block';
}

// Create country comparison chart
function createCountryChart(countries, stats) {
    const ctx = document.getElementById('country-chart');
    if (!ctx) return;
    
    // Destroy existing chart if any
    if (state.charts.country) {
        state.charts.country.destroy();
    }
    
    const avgValues = countries.map(c => parseFloat(stats[c].avg));
    const colors = countries.map(c => {
        const aqi = pm25ToAqi(parseFloat(stats[c].avg));
        const category = getAqiCategory(aqi);
        return category.color;
    });
    
    state.charts.country = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: countries,
            datasets: [{
                label: 'Average PM2.5 (µg/m³)',
                data: avgValues,
                backgroundColor: colors.map(c => c + '80'),
                borderColor: colors,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'Average Air Quality by Country (Top 10)',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const country = context.label;
                            const value = context.parsed.y;
                            const aqi = pm25ToAqi(value);
                            const category = getAqiCategory(aqi);
                            return [
                                `PM2.5: ${value.toFixed(1)} µg/m³`,
                                `AQI: ${aqi}`,
                                `Status: ${category.label}`,
                                `Records: ${stats[country].count}`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'PM2.5 (µg/m³)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Country'
                    }
                }
            }
        }
    });
}

// Handle extended forecast generation
async function handleExtendedForecast() {
    const days = parseInt(elements.forecastDays.value);
    const hours = days * 24;
    
    // Disable button
    elements.extendedPredictBtn.disabled = true;
    elements.extendedPredictBtn.textContent = '⏳ Generating Extended Forecast...';
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate extended forecast using iterative GRU prediction
    const extendedForecast = generateExtendedForecast(hours);
    state.extendedForecastData = extendedForecast;
    
    console.log(`Extended forecast generated: ${hours} hours (${days} days)`);
    
    // Update extended forecast chart
    updateExtendedForecastChart(extendedForecast, days);
    
    // Show extended forecast summary
    showExtendedForecastSummary(extendedForecast, days);
    
    // Re-enable button
    elements.extendedPredictBtn.disabled = false;
    elements.extendedPredictBtn.textContent = '🔮 Generate Extended Forecast';
}

// Generate extended forecast using iterative prediction
function generateExtendedForecast(hours) {
    const forecast = [];
    let currentData = [...state.historicalData.slice(-CONFIG.SEQUENCE_LENGTH)];
    
    for (let i = 0; i < hours; i++) {
        // Use GRU predictor for next hour
        const nextHourForecast = gruPredictor.forecast(currentData, 1);
        const nextValue = nextHourForecast[0];
        
        // Create timestamp for this prediction
        const lastTimestamp = new Date(currentData[currentData.length - 1].timestamp);
        const nextTimestamp = new Date(lastTimestamp);
        nextTimestamp.setHours(nextTimestamp.getHours() + 1);
        
        // Add to forecast
        forecast.push(nextValue);
        
        // Update current data window (rolling prediction)
        currentData.push({
            timestamp: nextTimestamp.toISOString(),
            pm25: nextValue
        });
        currentData.shift(); // Remove oldest entry
    }
    
    return forecast;
}

// Update extended forecast chart
function updateExtendedForecastChart(forecast, days) {
    const ctx = document.getElementById('extended-forecast-chart');
    if (!ctx) return;
    
    // Destroy existing chart if any
    if (state.charts.extendedForecast) {
        state.charts.extendedForecast.destroy();
    }
    
    // Create labels (show dates instead of hours for multi-day)
    const now = new Date();
    const labels = forecast.map((_, i) => {
        const date = new Date(now);
        date.setHours(date.getHours() + i + 1);
        
        // Show date + time for every 12 hours
        if (i % 12 === 0) {
            return date.toLocaleDateString([], {month: 'short', day: 'numeric'}) + ' ' + 
                   date.toLocaleTimeString([], {hour: '2-digit', hour12: false}) + ':00';
        }
        return '';
    });
    
    // Convert to AQI for color coding
    const aqiValues = forecast.map(pm25 => pm25ToAqi(pm25));
    const colors = forecast.map(pm25 => {
        const aqi = pm25ToAqi(pm25);
        const category = getAqiCategory(aqi);
        return category.color;
    });
    
    state.charts.extendedForecast = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Predicted PM2.5 (µg/m³)',
                data: forecast,
                borderColor: '#4a90e2',
                backgroundColor: 'rgba(74, 144, 226, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                segment: {
                    borderColor: (ctx) => {
                        const index = ctx.p0DataIndex;
                        return colors[index] || '#4a90e2';
                    }
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: `${days}-Day Extended GRU Forecast`,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const pm25 = context.parsed.y;
                            const aqi = pm25ToAqi(pm25);
                            const category = getAqiCategory(aqi);
                            return [
                                `PM2.5: ${pm25.toFixed(1)} µg/m³`,
                                `AQI: ${aqi}`,
                                `Category: ${category.label}`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'PM2.5 (µg/m³)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date & Time'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

// Show extended forecast summary with daily breakdowns
function showExtendedForecastSummary(forecast, days) {
    let html = '<h3>📊 Daily Forecast Summary</h3>';
    html += '<div class="day-forecast">';
    
    const hoursPerDay = 24;
    
    for (let day = 0; day < days; day++) {
        const startIdx = day * hoursPerDay;
        const endIdx = Math.min((day + 1) * hoursPerDay, forecast.length);
        const dayData = forecast.slice(startIdx, endIdx);
        
        if (dayData.length === 0) continue;
        
        const avgPm25 = dayData.reduce((a, b) => a + b, 0) / dayData.length;
        const maxPm25 = Math.max(...dayData);
        const minPm25 = Math.min(...dayData);
        const avgAqi = pm25ToAqi(avgPm25);
        const category = getAqiCategory(avgAqi);
        
        const date = new Date();
        date.setDate(date.getDate() + day + 1);
        const dayLabel = day === 0 ? 'Tomorrow' : 
                        day === 1 ? 'Day After Tomorrow' :
                        date.toLocaleDateString([], {weekday: 'short', month: 'short', day: 'numeric'});
        
        html += `
            <div class="day-card">
                <div class="day-label">${dayLabel}</div>
                <div class="day-aqi ${category.class}">${avgAqi}</div>
                <div class="day-category" style="background-color: ${category.color}20; color: ${category.color};">
                    ${category.label}
                </div>
                <div style="margin-top: 10px; font-size: 0.85rem; color: var(--text-light);">
                    Avg: ${avgPm25.toFixed(1)} µg/m³<br>
                    Range: ${minPm25.toFixed(1)} - ${maxPm25.toFixed(1)}
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    
    elements.extendedForecastSummary.innerHTML = html;
    elements.extendedForecastSummary.style.display = 'block';
}

// ============================================
// BUSINESS VALUE FUNCTIONS
// ============================================

// Update business impact metrics based on current and forecast data
function updateBusinessMetrics() {
    const latestData = state.historicalData[state.historicalData.length - 1];
    const currentAqi = pm25ToAqi(latestData.pm25);
    const category = getAqiCategory(currentAqi);
    
    // Update health risk level
    if (elements.healthRiskLevel) {
        elements.healthRiskLevel.textContent = category.label;
        elements.healthRiskLevel.style.color = category.color;
    }
    
    // Calculate metrics from forecast if available
    if (state.forecastData && state.forecastData.length > 0) {
        const forecastAqis = state.forecastData.map(pm25 => pm25ToAqi(pm25));
        
        // Count high-risk hours (AQI > 100)
        const highRiskHours = forecastAqis.filter(aqi => aqi > 100).length;
        if (elements.healthAlertCount) {
            elements.healthAlertCount.textContent = highRiskHours;
        }
        
        // Count optimal hours (AQI < 50)
        const optimalHours = forecastAqis.filter(aqi => aqi <= 50).length;
        if (elements.optimalHours) {
            elements.optimalHours.textContent = optimalHours;
        }
        
        // Calculate efficiency score (percentage of good hours)
        const efficiencyPercent = Math.round((optimalHours / forecastAqis.length) * 100);
        if (elements.efficiencyScore) {
            elements.efficiencyScore.textContent = `${efficiencyPercent}%`;
        }
        
        // Calculate risk score based on average AQI
        const avgForecastAqi = forecastAqis.reduce((a, b) => a + b, 0) / forecastAqis.length;
        const riskCategory = getAqiCategory(Math.round(avgForecastAqi));
        if (elements.riskScore) {
            elements.riskScore.textContent = riskCategory.label;
            elements.riskScore.style.color = riskCategory.color;
        }
        
        // Find first occurrence of unhealthy AQI for warning hours
        const firstUnhealthyIndex = forecastAqis.findIndex(aqi => aqi > 100);
        const warningHours = firstUnhealthyIndex >= 0 ? firstUnhealthyIndex : 24;
        if (elements.warningHours) {
            elements.warningHours.textContent = warningHours;
        }
        
        // Estimate cost savings (simplified calculation)
        const preventableIncidents = Math.round(highRiskHours * 0.05 * 1000); // 5% of 1000 people per high-risk hour
        const avgCostPerIncident = 500; // Average healthcare cost
        const estimatedSavings = preventableIncidents * avgCostPerIncident;
        if (elements.costSavings) {
            elements.costSavings.textContent = `$${estimatedSavings.toLocaleString()}`;
        }
        
        // Show health advisory
        updateHealthAdvisory(currentAqi, forecastAqis);
    } else {
        // No forecast data yet - show defaults
        if (elements.healthAlertCount) elements.healthAlertCount.textContent = '--';
        if (elements.optimalHours) elements.optimalHours.textContent = '--';
        if (elements.efficiencyScore) elements.efficiencyScore.textContent = '--';
        if (elements.riskScore) elements.riskScore.textContent = '--';
        if (elements.warningHours) elements.warningHours.textContent = '--';
        if (elements.costSavings) elements.costSavings.textContent = '$0';
    }
}

// Update health advisory section
function updateHealthAdvisory(currentAqi, forecastAqis) {
    if (!elements.healthAdvisory) return;
    
    const currentCategory = getAqiCategory(currentAqi);
    const avgForecastAqi = forecastAqis.reduce((a, b) => a + b, 0) / forecastAqis.length;
    const forecastCategory = getAqiCategory(Math.round(avgForecastAqi));
    
    // Show health advisory card
    elements.healthAdvisory.style.display = 'block';
    
    // Current risk advisory
    if (elements.currentRiskAdvisory) {
        elements.currentRiskAdvisory.innerHTML = `
            <div style="background-color: ${currentCategory.color}20; border-left: 4px solid ${currentCategory.color}; padding: 15px; border-radius: 6px;">
                <div style="font-size: 1.5rem; font-weight: bold; color: ${currentCategory.color}; margin-bottom: 10px;">
                    ${currentCategory.label}
                </div>
                <div style="color: var(--text);">
                    Current AQI: <strong>${currentAqi}</strong><br>
                    24-Hour Forecast: <strong>${forecastCategory.label}</strong> (Avg AQI: ${Math.round(avgForecastAqi)})
                </div>
            </div>
        `;
    }
    
    // Recommended actions based on AQI level
    if (elements.recommendedActions) {
        const actions = getRecommendedActions(Math.max(currentAqi, Math.round(avgForecastAqi)));
        elements.recommendedActions.innerHTML = `<ul class="action-list">${actions.map(action => `<li>${action}</li>`).join('')}</ul>`;
    }
    
    // Vulnerable groups
    if (elements.vulnerableGroups) {
        const groups = getVulnerableGroups(Math.max(currentAqi, Math.round(avgForecastAqi)));
        elements.vulnerableGroups.innerHTML = `<ul class="vulnerable-list">${groups.map(group => `<li>${group}</li>`).join('')}</ul>`;
    }
    
    // Risk timeline chart
    updateRiskTimelineChart(forecastAqis);
}

// Get recommended actions based on AQI level
function getRecommendedActions(aqi) {
    if (aqi <= 50) {
        return [
            'Air quality is good - ideal for outdoor activities',
            'No restrictions on outdoor exercise',
            'Perfect time for outdoor events and gatherings'
        ];
    } else if (aqi <= 100) {
        return [
            'Unusually sensitive people should limit prolonged outdoor exertion',
            'Consider reducing intense outdoor activities',
            'Monitor air quality if planning extended outdoor exposure'
        ];
    } else if (aqi <= 150) {
        return [
            'Sensitive groups should reduce prolonged outdoor exertion',
            'General public should limit intense outdoor activities',
            'Close windows to prevent outdoor air from entering',
            'Use air purifiers indoors'
        ];
    } else if (aqi <= 200) {
        return [
            'Everyone should avoid prolonged outdoor exertion',
            'Sensitive groups should avoid all outdoor activities',
            'Wear N95 masks if outdoor exposure is necessary',
            'Keep indoor air clean with purifiers',
            'Reschedule outdoor events if possible'
        ];
    } else if (aqi <= 300) {
        return [
            'Everyone should avoid all outdoor physical activities',
            'Stay indoors with windows and doors closed',
            'Use high-efficiency air purifiers',
            'Sensitive groups should remain indoors',
            'Emergency measures may be necessary'
        ];
    } else {
        return [
            'Health alert: Everyone should avoid all outdoor activities',
            'Remain indoors with air purification systems',
            'Seek medical attention if experiencing symptoms',
            'Follow emergency protocols',
            'Consider evacuation if conditions persist'
        ];
    }
}

// Get vulnerable groups based on AQI level
function getVulnerableGroups(aqi) {
    const baseGroups = [
        'Children and teenagers',
        'Older adults (65+)',
        'People with heart or lung disease',
        'People with asthma'
    ];
    
    if (aqi > 100) {
        baseGroups.push('Pregnant women');
        baseGroups.push('People with diabetes');
    }
    
    if (aqi > 150) {
        baseGroups.push('Outdoor workers');
        baseGroups.push('Athletes and active individuals');
    }
    
    if (aqi > 200) {
        baseGroups.push('All individuals (general population)');
    }
    
    return baseGroups;
}

// Update risk timeline chart
function updateRiskTimelineChart(forecastAqis) {
    const ctx = document.getElementById('risk-timeline-chart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (state.charts.riskTimeline) {
        state.charts.riskTimeline.destroy();
    }
    
    const labels = forecastAqis.map((_, i) => `${i + 1}h`);
    const colors = forecastAqis.map(aqi => {
        const category = getAqiCategory(aqi);
        return category.color;
    });
    
    state.charts.riskTimeline = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'AQI Level',
                data: forecastAqis,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const aqi = context.parsed.y;
                            const category = getAqiCategory(aqi);
                            return [
                                `AQI: ${aqi}`,
                                `Level: ${category.label}`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'AQI'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'var(--text)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Hours Ahead'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'var(--text)'
                    }
                }
            }
        }
    });
}

// Calculate ROI based on user inputs
function calculateROI() {
    const population = parseInt(elements.populationInput.value) || 0;
    const healthcareCost = parseFloat(elements.healthcareCostInput.value) || 0;
    const preventionRate = parseFloat(elements.preventionRateInput.value) || 0;
    
    if (population <= 0 || healthcareCost <= 0 || preventionRate <= 0) {
        alert('Please enter valid values for all fields');
        return;
    }
    
    // Calculate based on forecast data if available, otherwise use historical data
    let highRiskDaysPerMonth = 10; // Default assumption (10 days per month with AQI > 100)
    
    if (state.forecastData && state.forecastData.length > 0) {
        // Use forecast data
        const forecastAqis = state.forecastData.map(pm25 => pm25ToAqi(pm25));
        const highRiskHours = forecastAqis.filter(aqi => aqi > 100).length;
        highRiskDaysPerMonth = Math.round((highRiskHours / 24) * 30); // Scale to monthly
    } else if (state.historicalData && state.historicalData.length > 0) {
        // Use historical data as baseline
        const recentData = state.historicalData.slice(-168); // Last 7 days
        const recentAqis = recentData.map(d => pm25ToAqi(d.pm25));
        const highRiskHours = recentAqis.filter(aqi => aqi > 100).length;
        highRiskDaysPerMonth = Math.round((highRiskHours / 168) * 24 * 30); // Scale to monthly
    }
    
    // Ensure at least some risk days for realistic calculation
    if (highRiskDaysPerMonth < 1) {
        highRiskDaysPerMonth = 5; // Minimum assumption
    }
    
    // Calculate annual savings
    // Assumption: On high-risk days, prevention rate % of population can avoid health incidents
    const affectedPopulation = population * (preventionRate / 100);
    const incidentRatePerDay = 0.001; // 0.1% of affected population per high-risk day
    const incidentsPerYear = highRiskDaysPerMonth * 12 * affectedPopulation * incidentRatePerDay;
    const annualSavings = incidentsPerYear * healthcareCost;
    
    // Calculate prevented incidents
    const preventedIncidents = Math.round(incidentsPerYear);
    
    // Calculate ROI multiple (assuming implementation cost of $50k)
    const implementationCost = 50000;
    const roiMultiple = (annualSavings / implementationCost).toFixed(1);
    
    // Display results
    if (elements.annualSavings) {
        elements.annualSavings.textContent = `$${Math.round(annualSavings).toLocaleString()}`;
    }
    if (elements.preventedIncidents) {
        elements.preventedIncidents.textContent = preventedIncidents.toLocaleString();
    }
    if (elements.roiMultiple) {
        elements.roiMultiple.textContent = `${roiMultiple}x`;
    }
    
    // Show results
    if (elements.roiResults) {
        elements.roiResults.style.display = 'grid';
    }
    
    console.log('ROI Calculation:', {
        population,
        healthcareCost,
        preventionRate,
        highRiskDaysPerMonth,
        annualSavings: Math.round(annualSavings),
        preventedIncidents,
        roiMultiple
    });
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Optional: Auto-update every minute
setInterval(() => {
    // Add new data point
    const lastData = state.historicalData[state.historicalData.length - 1];
    const newTimestamp = new Date(lastData.timestamp);
    newTimestamp.setHours(newTimestamp.getHours() + 1);
    
    // Generate new PM2.5 value based on pattern
    const hour = newTimestamp.getHours();
    let pm25 = lastData.pm25 + (Math.random() - 0.5) * 5;
    pm25 += Math.sin((hour - 6) / 24 * Math.PI * 2) * 2;
    pm25 = Math.max(5, Math.min(250, pm25));
    
    state.historicalData.push({
        timestamp: newTimestamp.toISOString(),
        pm25: parseFloat(pm25.toFixed(1))
    });
    
    // Keep only last 30 days
    if (state.historicalData.length > 720) {
        state.historicalData.shift();
    }
    
    // Update displays
    updateCurrentStatus();
    updateHistoryChart();
    updateHourlyChart();
}, CONFIG.UPDATE_INTERVAL);
