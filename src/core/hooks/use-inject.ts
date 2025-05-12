import type { ProviderToken } from '@adimm/x-injection';

import { useComponentModule } from './use-component-module';

/**
 * Low-level hook which can be used to resolve a single dependency from the current
 * context module.
 *
 * **Note:** _In order to better modularize your code-base, you should strive to create custom hooks by using the_
 * _`hookFactory` method to compose a custom hook._
 *
 * @param provider The {@link ProviderToken}.
 * @param options See {@link UseInjectOptions}.
 * @returns The resolved {@link T | dependency}.
 */
export function useInject<T>(provider: ProviderToken<T>, options?: UseInjectOptions): T {
  const componentModule = useComponentModule();

  return componentModule.get(provider, options?.isOptional);
}

export type UseInjectOptions = {
  /** When set to `false` _(default)_ an exception will be thrown when the `providerOrIdentifier` isn't bound. */
  isOptional?: boolean;
};
