export const calculateXPGain = (won) => {
  const baseXP = 25;

  if (won) {
    return baseXP;
  } else {
    // Loss gives minimal XP, but still some for participation
    return 5;
  }
};

export const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
};

export const generateUsernameFromEmail = (email) => {
  const baseUsername = email.split("@")[0].toLowerCase();
  const randomSuffix = Math.floor(Math.random() * 1000);
  return `${baseUsername}${randomSuffix}`;
};

export const getRankColor = (rank) => {
  const colors = {
    Iron: "#8B5A3C",
    Bronze: "#CD7F32",
    Silver: "#C0C0C0",
    Gold: "#FFD700",
    Platinum: "#E5E4E2",
  };
  return colors[rank] || colors.Iron;
};

export const sanitizeInput = (input, maxLength = 200) => {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, maxLength);
};
