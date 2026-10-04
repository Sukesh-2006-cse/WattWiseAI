const mongoose = require('mongoose');

const TelemetrySchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    voltage: {
      type: Number,
      required: true,
    },
    current: {
      type: Number,
      required: true,
    },
    power: {
      type: Number,
      required: true,
      default: 0,
    },
    energy: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      required: true,
      default: 'NO LOAD',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Telemetry', TelemetrySchema);
