import { Injectable, InjectionScope } from '@adimm/x-injection';

@Injectable(InjectionScope.Singleton)
export class GlobalService {}

@Injectable()
export class EmptyService {}

@Injectable(InjectionScope.Singleton)
export class RandomService {
  random = Math.random();
}

@Injectable()
export class UserService {
  firstName = '';
  lastName = '';

  generateFullName(firstName?: string, lastName?: string): string {
    return `${firstName ?? this.firstName} ${lastName ?? this.lastName}`;
  }
}
