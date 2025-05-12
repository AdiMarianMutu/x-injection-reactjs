import { XInjectionProviderModuleError } from '@adimm/x-injection';

export class InjectionHookFactoryError extends XInjectionProviderModuleError {
  override name = InjectionHookFactoryError.name;
}
