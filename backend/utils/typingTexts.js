// Collection of typing texts for word typing duels
// These texts are designed to be challenging but fair for competitive typing
// NOTE: This static data is now used only as fallback when MongoDB is unavailable
// The primary source is now the TypingText MongoDB model

const typingTexts = [
  {
    id: 1,
    text: "The quick brown fox jumps over the lazy dog near the riverbank while birds chirp melodiously in the ancient oak trees swaying gently in the cool morning breeze",
    difficulty: "easy",
    category: "classic",
  },
  {
    id: 2,
    text: "Programming requires logical thinking and problem solving skills to create efficient algorithms that can process data structures and handle complex computational tasks effectively",
    difficulty: "medium",
    category: "programming",
  },
  {
    id: 3,
    text: "JavaScript developers must understand asynchronous programming patterns including promises callbacks and async await syntax to build responsive web applications that handle user interactions smoothly",
    difficulty: "medium",
    category: "programming",
  },
  {
    id: 4,
    text: "Machine learning algorithms utilize mathematical models to analyze patterns in large datasets enabling artificial intelligence systems to make predictions and classifications with remarkable accuracy",
    difficulty: "hard",
    category: "technology",
  },
  {
    id: 5,
    text: "The ancient library contained thousands of leather bound books filled with wisdom from scholars who dedicated their lives to understanding the mysteries of science philosophy and mathematics",
    difficulty: "medium",
    category: "literature",
  },
  {
    id: 6,
    text: "Competitive programming contests challenge participants to solve algorithmic problems efficiently using optimal time and space complexity while implementing clean readable code within strict time constraints",
    difficulty: "hard",
    category: "programming",
  },
  {
    id: 7,
    text: "Modern web development frameworks provide powerful tools for building interactive user interfaces that respond dynamically to user input while maintaining excellent performance across different devices",
    difficulty: "medium",
    category: "programming",
  },
  {
    id: 8,
    text: "Scientists discovered that quantum computers can perform certain calculations exponentially faster than classical computers by leveraging quantum mechanical phenomena such as superposition and entanglement",
    difficulty: "hard",
    category: "science",
  },
  {
    id: 9,
    text: "The mountain climber carefully planned each step up the treacherous rocky slope while monitoring weather conditions and ensuring safety equipment was properly secured for the challenging ascent",
    difficulty: "easy",
    category: "adventure",
  },
  {
    id: 10,
    text: "Database administrators optimize query performance by analyzing execution plans creating appropriate indexes and implementing efficient schema designs that support high volume transaction processing",
    difficulty: "hard",
    category: "programming",
  },
  {
    id: 11,
    text: "Children learn best through interactive play and exploration that encourages creativity while building fundamental skills in communication mathematics and critical thinking through engaging activities",
    difficulty: "easy",
    category: "education",
  },
  {
    id: 12,
    text: "Blockchain technology revolutionizes digital transactions by creating decentralized networks that maintain transparent immutable ledgers without requiring traditional financial intermediaries or central authorities",
    difficulty: "hard",
    category: "technology",
  },
  {
    id: 13,
    text: "Professional musicians practice scales and techniques daily to develop muscle memory and maintain precise finger coordination that enables them to perform complex compositions with emotional expression",
    difficulty: "medium",
    category: "music",
  },
  {
    id: 14,
    text: "Cloud computing platforms provide scalable infrastructure services that allow businesses to deploy applications globally while reducing operational costs and improving system reliability through redundancy",
    difficulty: "medium",
    category: "technology",
  },
  {
    id: 15,
    text: "Cooking requires careful attention to ingredient proportions cooking temperatures and timing to create delicious meals that balance flavors textures and nutritional value for optimal dining experiences",
    difficulty: "easy",
    category: "lifestyle",
  },
];

// Export for seeding purposes
export { typingTexts };

/**
 * Get a random typing text based on difficulty from MongoDB
 * @param {string} difficulty - "easy", "medium", or "hard"
 * @param {string} category - Optional category filter
 * @returns {Object} Random typing text object
 */
export async function getRandomTypingText(difficulty = null, category = null) {
  try {
    // Dynamic import to avoid circular dependencies
    const TypingText = (await import("../models/TypingText.js")).default;

    const typingText = await TypingText.getRandomText(difficulty, category);

    if (!typingText) {
      // Fallback to static data if no texts in database
      console.warn(
        "No typing texts found in database, falling back to static data"
      );
      return getRandomTypingTextFromStatic(difficulty);
    }

    return typingText.getFormattedData();
  } catch (error) {
    console.error("Error fetching typing text from database:", error);
    // Fallback to static data on error
    return getRandomTypingTextFromStatic(difficulty);
  }
}

/**
 * Fallback function to get random typing text from static data
 * @param {string} difficulty - "easy", "medium", or "hard"
 * @returns {Object} Random typing text object
 */
function getRandomTypingTextFromStatic(difficulty = null) {
  let filteredTexts = typingTexts;

  if (difficulty) {
    filteredTexts = typingTexts.filter(
      (text) => text.difficulty === difficulty
    );
  }

  if (filteredTexts.length === 0) {
    filteredTexts = typingTexts; // Fallback to all texts
  }

  const randomIndex = Math.floor(Math.random() * filteredTexts.length);
  const selectedText = filteredTexts[randomIndex];

  // Split text into words and add metadata
  const words = selectedText.text.split(/\s+/);

  return {
    ...selectedText,
    words,
    totalWords: words.length,
    avgWordLength:
      words.reduce((sum, word) => sum + word.length, 0) / words.length,
  };
}

/**
 * Calculate typing statistics
 * @param {string} typedText - The text typed by user
 * @param {string} originalText - The original text to compare against
 * @param {number} timeInSeconds - Time taken in seconds
 * @returns {Object} Typing statistics
 */
export function calculateTypingStats(typedText, originalText, timeInSeconds) {
  const originalWords = originalText.split(/\s+/);
  const typedWords = typedText.split(/\s+/);

  let correctChars = 0;
  let totalChars = 0;

  // Calculate character-level accuracy
  const minLength = Math.min(typedText.length, originalText.length);
  for (let i = 0; i < minLength; i++) {
    if (typedText[i] === originalText[i]) {
      correctChars++;
    }
    totalChars++;
  }

  // Account for extra characters (mistakes)
  totalChars = Math.max(typedText.length, originalText.length);

  const accuracy = totalChars > 0 ? (correctChars / totalChars) * 100 : 0;
  const wpm = timeInSeconds > 0 ? (typedWords.length / timeInSeconds) * 60 : 0;

  // Check if completed with 100% accuracy
  const isCompleted = typedText.trim() === originalText.trim();
  const hasRequiredAccuracy = accuracy >= 100; // Enforce 100% accuracy requirement

  return {
    accuracy: Math.round(accuracy * 100) / 100,
    wpm: Math.round(wpm * 100) / 100,
    correctChars,
    totalChars,
    isCompleted,
    hasRequiredAccuracy,
    wordsTyped: typedWords.length,
    totalWords: originalWords.length,
  };
}
