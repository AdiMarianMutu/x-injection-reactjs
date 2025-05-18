import { InjectionProviderModuleError } from '@adimm/x-injection';
import { useMemo } from 'react';

import type { IComponentProviderModule, PropsWithModule } from '../../types';
import { useEffectOnce } from './use-effect-once';

export function useContextualizedModule(
  originalModule: IComponentProviderModule,
  componentProps?: PropsWithModule<object>
): IComponentProviderModule {
  const ctxModule = useMemo(() => {
    /* istanbul ignore next */
    const { module: forwardedModule, inject } = componentProps ?? {};
    let module = (forwardedModule ?? originalModule).toNaked();

    if (module.isMarkedAsGlobal && inject) {
      throw new InjectionProviderModuleError(
        module,
        `The 'inject' prop can be used only with modules which are not marked as global!`
      );
    }

    if (!module.isMarkedAsGlobal) {
      module = module._createContextualizedComponentInstance().toNaked();
    }

    if (inject) {
      const sideEffectsOriginal = new Map(module.registeredSideEffects);
      module.registeredSideEffects.clear();

      inject.forEach((provider) => {
        module.__unbind(provider);

        module.moduleUtils.bindToContainer(provider, module.defaultScope.native);
      });

      //@ts-expect-error Read-only property.
      module.registeredBindingSideEffects = sideEffectsOriginal;
    }

    return module;
  }, [originalModule, componentProps?.inject]);

  useEffectOnce(() => {
    return () => {
      ctxModule.dispose();
    };
  });

  return ctxModule;
}
