export const VALIDATION = {
  keyName: {
    empty: 'A key name is required.',
    tooLong: 'Key name must be 48 characters or fewer.',
    invalidChars: 'Key name may only contain lowercase letters, numbers, hyphens, and underscores.',
    startsWithHyphen: 'Key name must start with a letter or number.',
    duplicate: 'A key with this name already exists. Choose a different name.',
    reserved: 'This name is reserved. Choose a different name.',
  },
  inlineRename: {
    empty: 'A key name is required.',
    duplicate: 'A key with this name already exists.',
    tooLong: 'Key name must be 48 characters or fewer.',
    invalidChars: 'Lowercase letters, numbers, hyphens, and underscores only.',
  },
  threshold: {
    empty: 'A threshold is required.',
    belowMin: 'Minimum threshold is 50%.',
    aboveMax: 'Maximum threshold is 95%. The daily cap error handles the hard limit.',
    nonNumeric: 'Enter a number between 50 and 95.',
  },
  botToken: {
    empty: 'A bot token is required.',
    wrongFormat: 'Bot token format: 1234567890:AAAA... Verify the token from BotFather.',
  },
  chatId: {
    empty: 'A chat ID is required.',
    nonNumeric: 'Chat ID must be a number. Negative IDs indicate groups or channels.',
  },
};
