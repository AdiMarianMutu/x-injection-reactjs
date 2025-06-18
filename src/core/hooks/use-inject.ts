import type { ProviderToken } from '@adimm/x-injection';

import { useComponentModule } from './use-component-module';

/**
 * Low-level hook which can be used to resolve a single dependency.
 *
 * **Note:** _In order to better modularize your code-base, you should strive to create custom hooks by using the_
 * _`hookFactory` method to compose a custom hook._
 *
 * @param provider The {@link ProviderToken}.
 * @param options See {@link UseInjectOptions}.
 * @returns The resolved {@link T | dependency}.
 */
export function useInject<
  T,
  IsOptional extends boolean | undefined = undefined,
  AsList extends boolean | undefined = undefined,
>(provider: ProviderToken<T>, options?: UseInjectOptions<IsOptional, AsList>) {
  const componentModule = useComponentModule();

  return componentModule.get<T, IsOptional, AsList>(provider, options?.isOptional, options?.asList);
}

export type UseInjectOptions<
  IsOptional extends boolean | undefined = undefined,
  AsList extends boolean | undefined = undefined,
> = {
  /**
   * When set to `false` an exception will be thrown when the supplied `ProviderToken` isn't bound.
   *
   * Defaults to `false`.
   */
  isOptional?: IsOptional;

  /**
   * Set to `true` if you need to retrieve _all_ the bound identifiers of the supplied `ProviderToken`.
   *
   * Defaults to `false`.
   */
  asList?: AsList;
};
