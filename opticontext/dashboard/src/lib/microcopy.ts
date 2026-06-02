export const BUTTONS = {
  primary: {
    getAgentKey: 'Sign in',
    goToDashboard: 'Go to dashboard',
    createKey: 'Create key',
    copyKeyRevealed: 'Copy key',
    saveThreshold: 'Save threshold',
    saveWebhook: 'Save webhook',
    done: 'Done',
    uploadFile: 'Upload file',
    startQuickstart: 'Start the quickstart',
  },
  secondary: {
    seeTheDocs: 'See the docs',
    readTheQuickstart: 'Read the quickstart',
    viewApiReference: 'View API reference',
    manageAgentKeys: 'Manage agent keys',
    viewQuickstart: 'View quickstart',
    goToSettings: 'Go to Settings',
  },
  ghost: {
    dismissKeyReveal: "I've copied the key. Dismiss.",
    retry: 'Retry',
    cancel: 'Cancel',
    viewReference: 'View reference \u2192',
    viewFullApiReference: 'View full API reference',
    sendTestMessage: 'Send test message',
    signOut: 'Sign out',
  },
  destructive: {
    revoke: 'Revoke',
  },
  auth: {
    continueWithGoogle: 'Continue with Google',
  },
  config: {
    copyConfig: 'Copy config',
  },
};

export const LOADING = {
  usageData: 'Loading usage data',
  activity: 'Loading activity',
  keys: 'Loading keys',
  analytics: 'Loading analytics',
  checking: 'Checking',
  connecting: 'Connecting to OptiContext',
  generatingKey: 'Generating key',
  saving: 'Saving',
  revoking: 'Revoking',
  sending: 'Sending',
  uploading: 'Uploading',
  signingIn: 'Signing in',
  searching: 'Searching',
};

export const CONFIRMATIONS = {
  copied: 'Copied.',
  saved: 'Saved.',
  keyCreated: 'Key created.',
  keyRevoked: 'Key revoked.',
  testMessageSent: 'Test message sent.',
};

export const EMPTY_STATES = {
  noActivity: 'No recent activity. Capability calls will appear here after your runtime makes its first request.',
  noKeysDashboard: 'Create an agent key to get started.',
  noKeysDashboardBody: 'An agent key is required to authenticate your runtime with the MCP endpoint. Create one in Settings, then return here for your MCP config.',
  noKeysSettings: 'No agent keys yet. Create your first key to start using OptiContext.',
  noTelegram: 'No Telegram bot connected. Usage alerts will not be delivered until a bot token and chat ID are configured.',
  noDocsResults: 'No results. Try a different search term.',
  searchTooShort: 'Enter at least 2 characters to search.',
  logExport: 'Full log export coming soon.',
  featuresComingSoon: 'Alert thresholds and Telegram webhooks are coming soon. Settings entered here are not yet connected to a backend.',
};

export const TOOLTIPS = {
  totalRequestsToday: 'Across all capabilities. Resets at 00:00 UTC.',
  totalRequestsMonth: 'Running total since the 1st of the current UTC month.',
  dailyCapProgress: 'Per-agent key daily limit: 500 requests. Resets at 00:00 UTC.',
  statusOperational: 'All systems operational. Last checked [N]s ago.',
  statusDegraded: 'One or more capabilities reporting elevated latency. Last checked [N]s ago.',
  statusIncident: 'Service disruption detected. Check your runtime connection. Last checked [N]s ago.',
  showAgentKey: 'Show agent key',
  hideAgentKey: 'Hide agent key',
  copyEndpointUrl: 'Copy endpoint URL',
  copyAgentKey: 'Copy agent key',
  switchKey: 'Switch the agent key shown in the config blocks',
  fullKeyNotRecoverable: 'Full key is not recoverable from the dashboard.',
  neverUsed: 'This key has not yet made a capability call.',
  renameKey: 'Rename key',
  revokeKey: 'Revoke key',
  copyKeyName: 'Copy key name',
  saveBotFirst: 'Save your bot token and chat ID first.',
  mcpSessionId: 'Optional. Enables stateful session tracking across multiple capability calls.',
  providerUsed: 'Indicates which search provider resolved the request: primary or fallback.',
  cachedSearch: 'True when the response was served from the 15-minute query cache.',
  cachedTts: 'True when audio was served from the 24-hour TTS cache in edge storage.',
  budgetGuardThreshold: 'Budget guard activates at this threshold, before the hard provider limit.',
};

export const HOVER_LABELS = {
  copy: 'Copy',
  showAgentKey: 'Show agent key',
  hideAgentKey: 'Hide agent key',
  renameKey: 'Rename key',
  revokeKey: 'Revoke key',
  dismiss: 'Dismiss',
  confirm: 'Confirm',
  cancel: 'Cancel',
  expand: 'Expand',
  collapse: 'Collapse',
};

export const OPERATIONAL = {
  keyMasked: 'The key shown is masked. Reveal it above before copying.',
  keyRevealWarning: 'This key will not be shown again. Copy it now.',
  maxKeysReached: '10 agent keys active. Remove unused keys before creating new ones.',
  sessionExpired: 'Session expired. Sign in again to continue.',
  usageUnavailable: 'Usage data unavailable. Could not load capability usage from the OptiContext edge server. Reload the page to try again.',
  activityUnavailable: 'Activity data unavailable. Could not load recent capability calls. Reload the page to try again.',
  revokeFailed: 'Revoke failed. The key is still active.',
  authFailed: 'Authentication failed. Refresh the page and try again.',
  alertsContext: 'Alerts fire once per day per capability when the threshold is crossed. A Telegram bot token and chat ID must be configured below.',
  webhookConnected: 'Webhook connected',
  customConfigNote: 'Any runtime implementing MCP Streamable HTTP transport (2025-11-25) connects without modification. Refer to your runtime\'s MCP documentation for the exact config field names.',
};
