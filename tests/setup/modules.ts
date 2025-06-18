import { ProviderModule } from '@adimm/x-injection';

import { GlobalService, RandomService, UserService } from './services';

export const GlobalModuleBp = ProviderModule.blueprint({
  id: 'GlobalModule',
  isGlobal: true,
  providers: [GlobalService],
  exports: [GlobalService],
});

export const UserModuleBp = ProviderModule.blueprint({
  id: 'UserModule',
  providers: [UserService],
  exports: [UserService],
});

export const RandomModuleBp = ProviderModule.blueprint({
  id: 'RandomModule',
  providers: [RandomService],
  exports: [RandomService],
});
