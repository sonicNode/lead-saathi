const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    category: {
      type: String,
      default: "general"
    },
    summary: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      default: "new"
    },
    notes: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt"
    }
  }
);

module.exports = mongoose.model("Lead", leadSchema);

