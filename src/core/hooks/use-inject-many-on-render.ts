import type {
  ProviderModuleGetManyParam,
  ProviderModuleGetManySignature,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ProviderToken,
} from '@adimm/x-injection';
import { useContext } from 'react';

import type { UseInjectSharedOptions } from '../../types';
import { REACT_X_INJECTION_CONTEXT } from '../providers';

/**
 * Can be used to retrieve many resolved `dependencies` from the module container at once.
 *
 * **Note:** _By using this hook, the dependencies will be injected on each re-render process._
 * _If you need to inject the dependencies only once, you must use the `useInjectMany` hook._
 *
 * @param options See {@link UseInjectSharedOptions}.
 * @param deps Either one or more {@link ProviderToken}.
 * @returns Tuple containing the {@link D | dependencies}.
 */
export function useInjectManyOnRender<D extends (ProviderModuleGetManyParam<any> | ProviderToken)[]>({
  deps,
}: {
  deps: [...(D | unknown[])];
  options?: UseInjectSharedOptions;
}): ProviderModuleGetManySignature<D> {
  const componentModule = useContext(REACT_X_INJECTION_CONTEXT);

  return componentModule.ctx.getMany(...deps);
}
