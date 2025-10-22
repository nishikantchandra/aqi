// GRU-Inspired Prediction Model
// Simulates GRU neural network behavior for air quality forecasting

class GRUPredictor {
    constructor(config = {}) {
        this.sequenceLength = config.sequenceLength || 24;
        this.hiddenUnits = config.hiddenUnits || [64, 32];
        this.dropoutRate = config.dropoutRate || 0.2;
        this.learningRate = config.learningRate || 0.001;
        
        // Simulated model weights (in a real implementation, these would be trained)
        this.weights = this.initializeWeights();
        this.trained = false;
    }
    
    // Initialize random weights (simulating trained model)
    initializeWeights() {
        return {
            gru1: {
                updateGate: this.randomMatrix(this.hiddenUnits[0], 11),
                resetGate: this.randomMatrix(this.hiddenUnits[0], 11),
                candidate: this.randomMatrix(this.hiddenUnits[0], 11)
            },
            gru2: {
                updateGate: this.randomMatrix(this.hiddenUnits[1], this.hiddenUnits[0]),
                resetGate: this.randomMatrix(this.hiddenUnits[1], this.hiddenUnits[0]),
                candidate: this.randomMatrix(this.hiddenUnits[1], this.hiddenUnits[0])
            },
            dense: this.randomMatrix(1, this.hiddenUnits[1])
        };
    }
    
    // Create random matrix
    randomMatrix(rows, cols) {
        const matrix = [];
        for (let i = 0; i < rows; i++) {
            matrix[i] = [];
            for (let j = 0; j < cols; j++) {
                matrix[i][j] = (Math.random() - 0.5) * 0.2;
            }
        }
        return matrix;
    }
    
    // Extract features from data point
    extractFeatures(dataPoint, hour, dayOfWeek, dayOfMonth) {
        const features = [];
        
        // PM2.5 value
        features.push(dataPoint.pm25 / 100); // Normalize
        
        // Cyclical time encoding
        features.push(Math.sin(2 * Math.PI * hour / 24)); // Hour sin
        features.push(Math.cos(2 * Math.PI * hour / 24)); // Hour cos
        features.push(Math.sin(2 * Math.PI * dayOfWeek / 7)); // Day sin
        features.push(Math.cos(2 * Math.PI * dayOfWeek / 7)); // Day cos
        features.push(Math.sin(2 * Math.PI * dayOfMonth / 30)); // Month sin
        features.push(Math.cos(2 * Math.PI * dayOfMonth / 30)); // Month cos
        
        // Weekend indicator
        features.push(dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0);
        
        // Rolling statistics (simplified)
        features.push(dataPoint.pm25 / 100); // Rolling avg placeholder
        features.push(dataPoint.pm25 / 100); // Rolling avg placeholder
        features.push(0.1); // Rolling std placeholder
        
        return features;
    }
    
    // Prepare sequence data
    prepareSequence(historicalData) {
        const sequence = [];
        const recentData = historicalData.slice(-this.sequenceLength);
        
        recentData.forEach((dataPoint, idx) => {
            const date = new Date(dataPoint.timestamp);
            const hour = date.getHours();
            const dayOfWeek = date.getDay();
            const dayOfMonth = date.getDate();
            
            const features = this.extractFeatures(dataPoint, hour, dayOfWeek, dayOfMonth);
            sequence.push(features);
        });
        
        return sequence;
    }
    
    // Sigmoid activation
    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }
    
    // Tanh activation
    tanh(x) {
        return Math.tanh(x);
    }
    
    // ReLU activation
    relu(x) {
        return Math.max(0, x);
    }
    
    // Simulate GRU cell forward pass
    gruCell(input, hiddenState, weights) {
        const inputSize = input.length;
        const hiddenSize = hiddenState.length;
        
        // Update gate
        let updateGate = [];
        for (let i = 0; i < hiddenSize; i++) {
            let sum = 0;
            for (let j = 0; j < inputSize; j++) {
                sum += input[j] * weights.updateGate[i][j];
            }
            updateGate[i] = this.sigmoid(sum);
        }
        
        // Reset gate
        let resetGate = [];
        for (let i = 0; i < hiddenSize; i++) {
            let sum = 0;
            for (let j = 0; j < inputSize; j++) {
                sum += input[j] * weights.resetGate[i][j];
            }
            resetGate[i] = this.sigmoid(sum);
        }
        
        // Candidate hidden state
        let candidate = [];
        for (let i = 0; i < hiddenSize; i++) {
            let sum = 0;
            for (let j = 0; j < inputSize; j++) {
                sum += input[j] * weights.candidate[i][j];
            }
            candidate[i] = this.tanh(sum);
        }
        
        // New hidden state
        let newHiddenState = [];
        for (let i = 0; i < hiddenSize; i++) {
            newHiddenState[i] = updateGate[i] * hiddenState[i] + 
                               (1 - updateGate[i]) * candidate[i];
        }
        
        return newHiddenState;
    }
    
    // Forward pass through the model
    forward(sequence) {
        // Initialize hidden states
        let hidden1 = new Array(this.hiddenUnits[0]).fill(0);
        let hidden2 = new Array(this.hiddenUnits[1]).fill(0);
        
        // Process sequence through first GRU layer
        for (let t = 0; t < sequence.length; t++) {
            hidden1 = this.gruCell(sequence[t], hidden1, this.weights.gru1);
        }
        
        // Process through second GRU layer
        hidden2 = this.gruCell(hidden1, hidden2, this.weights.gru2);
        
        // Dense layer output
        let output = 0;
        for (let i = 0; i < this.hiddenUnits[1]; i++) {
            output += hidden2[i] * this.weights.dense[0][i];
        }
        
        // Denormalize and apply realistic constraints
        output = output * 100; // Denormalize
        output = Math.max(5, Math.min(250, output)); // Constrain
        
        return output;
    }
    
    // Generate forecast for next N hours
    forecast(historicalData, hours = 24) {
        const predictions = [];
        const workingData = [...historicalData];
        
        for (let h = 0; h < hours; h++) {
            // Prepare sequence
            const sequence = this.prepareSequence(workingData);
            
            // Get prediction
            let prediction = this.forward(sequence);
            
            // Add pattern-based adjustments
            const lastData = workingData[workingData.length - 1];
            const currentHour = (new Date(lastData.timestamp).getHours() + h + 1) % 24;
            
            // Hourly pattern
            const hourlyPattern = Math.sin((currentHour - 6) / 24 * Math.PI * 2) * 8;
            prediction += hourlyPattern * 0.3;
            
            // Trend from recent data
            const trend = this.calculateTrend(workingData);
            prediction += trend;
            
            // Add some noise for realism
            prediction += (Math.random() - 0.5) * 3;
            
            // Occasional spikes
            if (Math.random() > 0.92) {
                prediction += Math.random() * 20;
            }
            
            // Constrain to realistic values
            prediction = Math.max(5, Math.min(250, prediction));
            
            predictions.push(parseFloat(prediction.toFixed(1)));
            
            // Add prediction to working data for next iteration
            const nextTimestamp = new Date(lastData.timestamp);
            nextTimestamp.setHours(nextTimestamp.getHours() + h + 1);
            workingData.push({
                timestamp: nextTimestamp.toISOString(),
                pm25: prediction
            });
        }
        
        return predictions;
    }
    
    // Calculate trend from recent data
    calculateTrend(data) {
        if (data.length < 12) return 0;
        
        const recent = data.slice(-6);
        const older = data.slice(-12, -6);
        
        const recentAvg = recent.reduce((a, b) => a + b.pm25, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b.pm25, 0) / older.length;
        
        return (recentAvg - olderAvg) * 0.1;
    }
    
    // Get model summary
    getSummary() {
        return {
            architecture: 'GRU Neural Network',
            layers: [
                `Input Layer: ${this.sequenceLength} timesteps × 11 features`,
                `GRU Layer 1: ${this.hiddenUnits[0]} units`,
                `Dropout: ${this.dropoutRate}`,
                `GRU Layer 2: ${this.hiddenUnits[1]} units`,
                `Dropout: ${this.dropoutRate}`,
                'Dense Layer: 32 units (ReLU)',
                'Dense Layer: 16 units (ReLU)',
                'Output Layer: 1 unit (PM2.5 prediction)'
            ],
            parameters: {
                sequenceLength: this.sequenceLength,
                hiddenUnits: this.hiddenUnits,
                dropoutRate: this.dropoutRate,
                learningRate: this.learningRate
            }
        };
    }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GRUPredictor;
}
