import { Injectable } from '@nestjs/common';
import { Platform, SocialConnector } from '@velion/types';

import { FacebookConnector } from './facebook/facebook.connector';
import { InstagramConnector } from './instagram/instagram.connector';
import { LinkedInConnector } from './linkedin/linkedin.connector';
import { WhatsAppConnector } from './whatsapp/whatsapp.connector';

@Injectable()
export class ConnectorFactory {
  private readonly connectors: Map<Platform, SocialConnector>;

  constructor(
    private readonly whatsApp: WhatsAppConnector,
    private readonly instagram: InstagramConnector,
    private readonly facebook: FacebookConnector,
    private readonly linkedIn: LinkedInConnector,
  ) {
    this.connectors = new Map<Platform, SocialConnector>([
      [Platform.WHATSAPP, whatsApp],
      [Platform.INSTAGRAM, instagram],
      [Platform.FACEBOOK, facebook],
      [Platform.LINKEDIN, linkedIn],
    ]);
  }

  getConnector(platform: Platform): SocialConnector {
    const connector = this.connectors.get(platform);
    if (!connector)
      throw new Error(`No connector registered for platform: ${platform}`);
    return connector;
  }
}
