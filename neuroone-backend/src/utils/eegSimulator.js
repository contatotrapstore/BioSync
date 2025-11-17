/**
 * EEG Data Simulator for Testing
 * Generates realistic brain wave patterns
 */

/**
 * Generate random value within range
 */
function randomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate realistic EEG data packet
 * @param {Object} options - Configuration options
 * @returns {Object} - EEG data
 */
export function generateEEGData(options = {}) {
  const {
    baseAttention = 60,
    baseRelaxation = 50,
    variance = 15,
    focused = false,
    distracted = false,
  } = options;

  let attention = baseAttention;
  let relaxation = baseRelaxation;

  // Adjust for states
  if (focused) {
    attention += randomInRange(10, 25);
    relaxation -= randomInRange(5, 15);
  } else if (distracted) {
    attention -= randomInRange(15, 30);
    relaxation += randomInRange(0, 10);
  } else {
    // Normal variance
    attention += randomInRange(-variance, variance);
    relaxation += randomInRange(-variance, variance);
  }

  // Clamp values
  attention = Math.max(0, Math.min(100, attention));
  relaxation = Math.max(0, Math.min(100, relaxation));

  // Brain waves (in microvolts, typical ranges)
  const delta = randomInRange(80000, 200000); // Sleep/deep relaxation
  const theta = randomInRange(150000, 300000); // Drowsiness/meditation
  const alpha = randomInRange(250000, 450000); // Relaxed/eyes closed
  const beta = randomInRange(100000, 250000); // Active thinking
  const gamma = randomInRange(50000, 120000); // High-level processing

  // Signal quality (0-100, higher is better)
  const signalQuality = randomInRange(60, 95);

  return {
    attention,
    relaxation,
    delta,
    theta,
    alpha,
    beta,
    gamma,
    signalQuality,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Simulate student state over time
 */
export class StudentSimulator {
  constructor(studentId, studentName) {
    this.studentId = studentId;
    this.studentName = studentName;
    this.currentState = 'normal'; // normal, focused, distracted
    this.stateCounter = 0;
  }

  /**
   * Get next EEG data point
   */
  next() {
    // Change state every 20-40 cycles (5-10 seconds at 4Hz)
    this.stateCounter++;
    if (this.stateCounter > randomInRange(20, 40)) {
      const states = ['normal', 'focused', 'distracted'];
      this.currentState = states[randomInRange(0, 2)];
      this.stateCounter = 0;
    }

    return generateEEGData({
      focused: this.currentState === 'focused',
      distracted: this.currentState === 'distracted',
    });
  }

  /**
   * Reset state
   */
  reset() {
    this.currentState = 'normal';
    this.stateCounter = 0;
  }
}

/**
 * Create a mock EEG stream
 * @param {Function} callback - Called with each data point
 * @param {number} interval - Milliseconds between data points (default 250ms = 4Hz)
 */
export function createEEGStream(callback, interval = 250) {
  const intervalId = setInterval(() => {
    const data = generateEEGData();
    callback(data);
  }, interval);

  return {
    stop: () => clearInterval(intervalId),
  };
}

export default {
  generateEEGData,
  StudentSimulator,
  createEEGStream,
};
