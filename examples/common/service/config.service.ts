import ms from 'ms';
import { z } from 'zod';

export const baseConfigSchema = z.object({
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().transform((value) => value as ms.StringValue),
});

export type Config = z.infer<typeof baseConfigSchema>;

export class ConfigService<T extends Config = Config> {
  protected readonly config: T;

  constructor(config: T) {
    this.config = config;
  }

  get<K extends keyof T>(key: K): T[K] {
    return this.config[key];
  }
}
