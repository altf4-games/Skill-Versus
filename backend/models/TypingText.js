import mongoose from "mongoose";

const typingTextSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    words: [{
      type: String,
      required: true,
    }],
    totalWords: {
      type: Number,
      required: true,
      min: 1,
    },
    avgWordLength: {
      type: Number,
      required: true,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
typingTextSchema.index({ difficulty: 1, isActive: 1 });
typingTextSchema.index({ category: 1, isActive: 1 });
typingTextSchema.index({ difficulty: 1, category: 1, isActive: 1 });

// Pre-save middleware to calculate words and metadata
typingTextSchema.pre("save", function (next) {
  if (this.isModified("text")) {
    // Split text into words and calculate metadata
    const words = this.text.split(/\s+/).filter(word => word.length > 0);
    this.words = words;
    this.totalWords = words.length;
    this.avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  }
  next();
});

// Static method to get random typing text
typingTextSchema.statics.getRandomText = async function(difficulty = null, category = null) {
  const query = { isActive: true };
  
  if (difficulty) {
    query.difficulty = difficulty;
  }
  
  if (category) {
    query.category = category;
  }
  
  const count = await this.countDocuments(query);
  if (count === 0) {
    // Fallback to any active text if no match found
    const fallbackCount = await this.countDocuments({ isActive: true });
    if (fallbackCount === 0) {
      throw new Error("No typing texts available");
    }
    const randomIndex = Math.floor(Math.random() * fallbackCount);
    return await this.findOne({ isActive: true }).skip(randomIndex);
  }
  
  const randomIndex = Math.floor(Math.random() * count);
  const selectedText = await this.findOne(query).skip(randomIndex);
  
  // Increment usage count
  if (selectedText) {
    selectedText.usageCount += 1;
    await selectedText.save();
  }
  
  return selectedText;
};

// Instance method to get formatted text data
typingTextSchema.methods.getFormattedData = function() {
  return {
    id: this._id.toString(),
    text: this.text,
    difficulty: this.difficulty,
    category: this.category,
    words: this.words,
    totalWords: this.totalWords,
    avgWordLength: this.avgWordLength,
  };
};

export default mongoose.model("TypingText", typingTextSchema);
