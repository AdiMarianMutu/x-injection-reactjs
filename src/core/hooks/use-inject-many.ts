import type { ProviderModuleGetManyParam, ProviderModuleGetManySignature, ProviderToken } from '@adimm/x-injection';

import { useOnce } from '../../helpers';
import type { UseInjectSharedOptions } from '../../types';
import { useInjectManyOnRender } from './use-inject-many-on-render';

/**
 * Can be used to retrieve many resolved `dependencies` from the module container at once.
 *
 * **Note:** _By using this hook, the dependencies will be injected only once after the first component mount process._
 * _If you need to re-inject the dependencies on each re-render, you must use the `useInjectManyOnRender` hook._
 *
 * @param options See {@link UseInjectSharedOptions}.
 * @param deps Either one or more {@link ProviderToken}.
 * @returns Tuple containing the {@link D | dependencies}.
 */
export function useInjectMany<D extends (ProviderModuleGetManyParam<any> | ProviderToken)[]>({
  deps,
  options,
}: {
  deps: [...(D | unknown[])];
  options?: UseInjectSharedOptions;
}): ProviderModuleGetManySignature<D> {
  return useOnce(() => useInjectManyOnRender({ options, deps }));
}
