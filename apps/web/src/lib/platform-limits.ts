export interface PlatformLimit {
  charLimit: number | null;
  maxMedia: number;
  requiresMedia: boolean;
  supportsVideo: boolean;
  label: string;
  color: string;
}

export const PLATFORM_LIMITS: Record<string, PlatformLimit> = {
  WHATSAPP: {
    charLimit: 4096,
    maxMedia: 1,
    requiresMedia: false,
    supportsVideo: true,
    label: 'WhatsApp',
    color: '#25D366',
  },
  INSTAGRAM: {
    charLimit: 2200,
    maxMedia: 10,
    requiresMedia: true,
    supportsVideo: true,
    label: 'Instagram',
    color: '#E1306C',
  },
  FACEBOOK: {
    charLimit: 63206,
    maxMedia: 10,
    requiresMedia: false,
    supportsVideo: true,
    label: 'Facebook',
    color: '#1877F2',
  },
  LINKEDIN: {
    charLimit: 3000,
    maxMedia: 9,
    requiresMedia: false,
    supportsVideo: true,
    label: 'LinkedIn',
    color: '#0A66C2',
  },
  TWITTER: {
    charLimit: 280,
    maxMedia: 4,
    requiresMedia: false,
    supportsVideo: true,
    label: 'X (Twitter)',
    color: '#000000',
  },
  TIKTOK: {
    charLimit: 2200,
    maxMedia: 1,
    requiresMedia: true,
    supportsVideo: true,
    label: 'TikTok',
    color: '#010101',
  },
};

export function validatePost(platform: string, caption: string, mediaUrls: string[]): string[] {
  const limits = PLATFORM_LIMITS[platform];
  if (!limits) return [];

  const errors: string[] = [];

  if (limits.charLimit && caption.length > limits.charLimit) {
    errors.push(
      `Caption exceeds ${limits.charLimit.toLocaleString()} character limit (${caption.length} used)`,
    );
  }

  if (limits.requiresMedia && mediaUrls.length === 0) {
    errors.push(`${limits.label} requires at least one image or video`);
  }

  if (mediaUrls.length > limits.maxMedia) {
    errors.push(`${limits.label} supports a maximum of ${limits.maxMedia} media items`);
  }

  return errors;
}
