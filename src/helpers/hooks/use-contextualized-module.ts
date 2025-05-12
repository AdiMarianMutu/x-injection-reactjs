import { useMemo } from 'react';

import type { IComponentProviderModule } from '../../types';
import { useEffectOnce } from './use-effect-once';

export function useContextualizedModule(
  originalModule: IComponentProviderModule,
  forwardedModule?: IComponentProviderModule
): IComponentProviderModule {
  const ctxModule = useMemo(() => {
    return (forwardedModule ?? originalModule).toNaked()._createContextualizedComponentInstance();
  }, [originalModule, forwardedModule]);

  useEffectOnce(() => {
    return () => {
      ctxModule.dispose();
    };
  });

  return ctxModule;
}
