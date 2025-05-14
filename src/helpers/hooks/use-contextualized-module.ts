import { useMemo } from 'react';

import type { IComponentProviderModule } from '../../types';
import { useEffectOnce } from './use-effect-once';

export function useContextualizedModule(
  originalModule: IComponentProviderModule,
  forwardedModule?: IComponentProviderModule
): IComponentProviderModule {
  const ctxModule = useMemo(() => {
    const module = (forwardedModule ?? originalModule).toNaked();

    if (module.isMarkedAsGlobal) return module;

    return module._createContextualizedComponentInstance();
  }, [originalModule, forwardedModule]);

  useEffectOnce(() => {
    return () => {
      ctxModule.dispose();
    };
  });

  return ctxModule;
}
