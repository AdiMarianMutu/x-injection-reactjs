import type { ProviderToken } from '@adimm/x-injection';
import { useContext } from 'react';

import type { UseInjectSharedOptions } from '../../types';
import { REACT_X_INJECTION_CONTEXT } from '../providers';

/**
 * React `hook` which can be used inside a component to inject the required {@link provider | dependency}.
 *
 * **Note:** _By using this hook, the dependency will be injected on each re-render process._
 * _If you need to inject the dependency only once, you must use the `useInject` hook._
 * _It basically acts like a `Transient` scope, ensuring that a new dependency is injected on each re-render._
 *
 * @param provider The {@link ProviderToken}.
 * @param options See {@link UseInjectSharedOptions}.
 * @returns Either the {@link T | dependency} or `undefined` if {@link isOptional} is set to `true`.
 */
export function useInjectOnRender<T>(provider: ProviderToken<T>, options?: UseInjectOptions): T {
  const componentModule = useContext(REACT_X_INJECTION_CONTEXT);

  return componentModule.ctx.get(provider, options?.isOptional);
}

export type UseInjectOptions = UseInjectSharedOptions & {
  /** When set to `false` _(default)_ an exception will be thrown when the `providerOrIdentifier` isn't bound. */
  isOptional?: boolean;
};
