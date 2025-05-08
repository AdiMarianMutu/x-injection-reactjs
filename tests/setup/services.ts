import { Injectable, InjectionScope } from '@adimm/x-injection';

import { RIP_SERVICE_NAME } from './constants';

@Injectable()
export class EmptyService {}

@Injectable()
export class RandomService {
  random = Math.random();
}

@Injectable(InjectionScope.Transient)
export class RipService {
  name = RIP_SERVICE_NAME;
}

@Injectable()
export class CatService {
  remainingLives = 9;
}

@Injectable()
export class UserService {
  name: string | undefined = undefined;
}
