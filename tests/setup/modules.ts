import { AppModule as _AppModule } from '@adimm/x-injection';

import { ComponentProviderModule } from '../../src';
import { GlobalService, RandomService, UserService } from './services';

export const UserModule = new ComponentProviderModule({
  identifier: Symbol('UserModule'),
  providers: [UserService],
  exports: [UserService],
});

export const RandomModule = new ComponentProviderModule({
  identifier: Symbol('RandomModule'),
  providers: [RandomService],
  exports: [RandomService],
});

export const GlobalModule = new ComponentProviderModule({
  identifier: Symbol('GlobalModule'),
  markAsGlobal: true,
  providers: [GlobalService],
  exports: [GlobalService],
});

export const AppModule = _AppModule.register<true>({
  imports: [GlobalModule],
});
