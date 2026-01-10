export interface BetaSignupData {
  email: string;
  instagramHandle?: string;
  referralSource?: string;
  metadata?: Record<string, unknown>;
}

export interface BetaSignupResponse {
  success: boolean;
  signupId?: string;
  error?: string;
  message?: string;
  details?: unknown;
}
