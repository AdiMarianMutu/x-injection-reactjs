import type { ProviderModuleGetManyParam, ProviderModuleGetManySignature, ProviderToken } from '@adimm/x-injection';

import { useComponentModule } from './use-component-module';

/**
 * Low-level hook which can be used to resolve multiple dependencies at once from the current
 * context module.
 *
 * **Note:** _In order to better modularize your code-base, you should strive to create custom hooks by using the_
 * _`hookFactory` method to compose a custom hook._
 *
 * @param deps Either one or more {@link ProviderToken}.
 * @returns Tuple containing the {@link D | dependencies}.
 */
export function useInjectMany<D extends (ProviderModuleGetManyParam<any> | ProviderToken)[]>(
  ...deps: D | unknown[]
): ProviderModuleGetManySignature<D> {
  const componentModule = useComponentModule();

  return componentModule.getMany(...deps);
}
