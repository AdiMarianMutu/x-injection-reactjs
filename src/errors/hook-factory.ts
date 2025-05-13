import { InjectionProviderModuleError } from '@adimm/x-injection';

export class InjectionHookFactoryError extends InjectionProviderModuleError {
  override name = InjectionHookFactoryError.name;
}
