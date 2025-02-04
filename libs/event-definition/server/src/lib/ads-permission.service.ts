import { Cache } from '@e7/common/cache';
import { Injectable } from '@nestjs/common';

type AdPartnerResponse = {
  ads: 'sure, why not!' | 'you shall not pass!';
};

@Injectable()
export class IPLocationService {
  private readonly cache = new Cache<Promise<string | null>>(ONE_DAY, ONE_HOUR);

  locate(ip: string): Promise<string | null> {
    const cached = this.cache.get(ip);
    if (cached && !cached.isStale) return cached.value;

    const promise = fetch(`http://ip-api.com/json/${ip}`)
      .then((r) => r.json())
      .then((r: { countryCode?: string }) => r.countryCode ?? null)
      .catch(() => null);

    this.cache.store(ip, promise);

    return cached ? cached.value : promise;
  }
}

const ONE_DAY = 1000 * 60 * 60 * 24;
const ONE_HOUR = 1000 * 60 * 60;

@Injectable()
export class AdsPermissionService {
  private readonly cache = new Cache<Promise<boolean>>(ONE_DAY, ONE_HOUR);
  constructor(private readonly svc: IPLocationService) {}

  async hasPermission(ip: string) {
    const cc = await this.svc.locate(ip);
    if (!cc) return false;

    const cached = this.cache.get(cc);

    if (cached && !cached.isStale) return cached.value;

    const promise = fetch(
      `https://us-central1-o7tools.cloudfunctions.net/fun7-ad-partner?countryCode=${cc}`,
    )
      .then((r) => r.json())
      .then((r: AdPartnerResponse) => r.ads === 'sure, why not!')
      .catch(() => false);

    this.cache.store(ip, promise);

    return cached ? cached.value : promise;
  }
}
