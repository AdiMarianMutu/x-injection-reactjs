import { AppModule as _AppModule } from '@adimm/x-injection';

import { ComponentProviderModule } from '../../src';
import { CatService, RandomService, RipService, UserService } from './services';

export const AppModule = _AppModule.register<true>({
  providers: [RipService],
});

export const RandomModule = new ComponentProviderModule({
  identifier: Symbol('RandomModule'),
  providers: [RandomService],
});

export const PropertiesModule = new ComponentProviderModule({
  identifier: Symbol('PropertiesModule'),
  providers: [CatService, UserService],
});
