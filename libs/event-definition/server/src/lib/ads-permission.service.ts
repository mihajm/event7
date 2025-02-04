import { Cache } from '@e7/common/cache';
import { Injectable, InjectionToken, Logger, Provider } from '@nestjs/common';

type AdPartnerResponse = {
  ads: 'sure, why not!' | 'you shall not pass!';
};

export class IPLocationService {
  private readonly cache = new Cache<Promise<string | null>>();

  constructor(private readonly url: string) {}

  locate(ip: string): Promise<string | null> {
    const cached = this.cache.get(ip);
    if (!ip) return Promise.resolve(null);
    if (cached && !cached.isStale) return cached.value;

    const promise = fetch(`${this.url}/json/${ip}`)
      .then((r) => r.json())
      .then((r: { countryCode?: string }) => {
        if (!r.countryCode) {
          Logger.warn('No country code found for IP', ip);
          return null;
        }
        return r.countryCode;
      })
      .catch((e) => {
        Logger.error('Error locating IP', e);
        return null;
      });

    this.cache.store(ip, promise);

    return cached ? cached.value : promise;
  }
}

type AdPermissionServiceConfig = {
  url?: string;
  username?: string;
  password?: string;
};

interface IAdsPermissionService {
  hasPermission(ip?: string): Promise<boolean>;
}

@Injectable()
export class AdsPermissionService implements IAdsPermissionService {
  private readonly cache = new Cache<Promise<boolean>>();
  private readonly authHeader:
    | {
        Authorization: string;
      }
    | undefined;
  constructor(
    private readonly cfg: Required<AdPermissionServiceConfig>,
    private readonly svc: IPLocationService,
  ) {
    if (cfg.username || cfg.password) {
      this.authHeader = {
        Authorization: `Basic ${btoa(`${cfg.username}:${cfg.password}`)}`,
      };
    }
  }

  async hasPermission(ip?: string) {
    if (!ip) return false;
    const cc = await this.svc.locate(ip);
    if (!cc) return false;

    const cached = this.cache.get(cc);

    if (cached && !cached.isStale) return cached.value;

    const promise = fetch(`${this.cfg.url}/fun7-ad-partner?countryCode=${cc}`, {
      headers: {
        ...this.authHeader,
      },
    })
      .then((r) => r.json())
      .then((r: AdPartnerResponse) => r.ads === 'sure, why not!')
      .catch((e) => {
        Logger.error('Error checking ad permission', e);
        return false;
      });

    this.cache.store(ip, promise);

    return cached ? cached.value : promise;
  }
}

type ProvideAdPermissionServiceOptions = AdPermissionServiceConfig & {
  ipApiUrl?: string;
};

export type ProvideAdPermissionOptions<TConfig> = {
  resolveOptions: (conf: TConfig) => ProvideAdPermissionServiceOptions;
  inject: Array<InjectionToken<TConfig>>;
};

function hasRequiredOptions(
  cfg?: ProvideAdPermissionServiceOptions,
): cfg is Required<
  Omit<ProvideAdPermissionServiceOptions, 'username' | 'password'>
> &
  Pick<ProvideAdPermissionServiceOptions, 'username' | 'password'> {
  return !!cfg && !!cfg.url && !!cfg.ipApiUrl;
}

@Injectable()
export class NoPermissionService implements IAdsPermissionService {
  async hasPermission() {
    return false;
  }
}

export function provideAdPermissionService<TConfig>(
  provideOpt?: ProvideAdPermissionOptions<TConfig>,
): Provider[] {
  return [
    {
      provide: AdsPermissionService,
      useFactory: (opt?: TConfig) => {
        const cfg = opt ? (provideOpt?.resolveOptions(opt) ?? {}) : {};
        if (!hasRequiredOptions(cfg)) {
          Logger.warn(
            'Missing required options to request permission for ads type, falling back to no permissions',
          );
          return new NoPermissionService();
        }
        return new AdsPermissionService(
          {
            ...cfg,
            username: cfg.username ?? '',
            password: cfg.password ?? '',
          },
          new IPLocationService(cfg.ipApiUrl),
        );
      },

      inject: provideOpt?.inject,
    },
  ];
}
