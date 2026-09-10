export const ROUTES = {
  START: '/',
  ONBOARDING: {
    WELCOME: '/onboarding/welcome',
    PAIRING: '/onboarding/pairing',
    PIN: '/onboarding/pin',
    COMPLETE: '/onboarding/complete',
  },
  PATIENT: {
    HOME: '/(patient)/home',
    COMPANION: '/(patient)/companion',
    FAMILY: '/(patient)/family',
    FAMILY_DETAIL: (id: string) => `/(patient)/family/${id}`,
    MEMORIES: '/(patient)/memories',
    MEMORY_DETAIL: (id: string) => `/(patient)/memory/${id}`,
    COMFORT: '/(patient)/comfort',
    ACTIVITIES: '/(patient)/activities',
    HELP: '/(patient)/help',
    SETTINGS: '/(patient)/settings',
  },
} as const;
