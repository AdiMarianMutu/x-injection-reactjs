import type { ProviderToken } from '@adimm/x-injection';

import { useOnce } from '../../helpers';
import { useInjectOnRender, type UseInjectOptions } from './use-inject-on-render';

/**
 * React `hook` which can be used inside a component to inject the required {@link provider | dependency}.
 *
 * **Note:** _By using this hook, the dependency will be injected only once after the first component mount process._
 * _If you need to re-inject the dependency on each re-render, you must use the `useInjectOnRender` hook._
 * _It basically acts like a `Request` scope, ensuring that even a `Transient` dependency does not mutate during re-renders._
 *
 * @param provider The {@link ProviderToken}.
 * @param options See {@link UseInjectSharedOptions}.
 * @returns Either the {@link T | dependency} or `undefined` if {@link isOptional} is set to `true`.
 */
export function useInject<T>(provider: ProviderToken<T>, options?: UseInjectOptions): T {
  return useOnce(() => useInjectOnRender(provider, options));
}
