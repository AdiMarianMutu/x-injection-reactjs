import {
  InjectionProviderModuleError,
  ProviderModuleHelpers,
  ProviderTokenHelpers,
  type IProviderModule,
  type ModuleOrBlueprint,
  type ProviderModule,
} from '@adimm/x-injection';
import { useMemo } from 'react';

import type { PropsWithModule } from '../../types';
import { useEffectOnce } from './use-effect-once';

export function useMakeOrGetComponentModule(
  originalModule: ModuleOrBlueprint,
  componentProps?: PropsWithModule<object>
): IProviderModule {
  const componentModule = useMemo(() => {
    /* istanbul ignore next */
    const { module: forwardedModule, inject } = componentProps ?? {};
    const module = ProviderModuleHelpers.tryBlueprintToModule(forwardedModule ?? originalModule) as ProviderModule;

    if (module.options.isGlobal) {
      throw new InjectionProviderModuleError(module, `A 'global' module can't be supplied to a component!`);
    }

    inject?.forEach((provider) => {
      if (!module.hasProvider(provider)) {
        throw new InjectionProviderModuleError(
          module,
          `The [${ProviderTokenHelpers.providerTokenToString(provider)}] provider can't be replaced because it is not part of the component module!`
        );
      }

      module.update.removeProvider(ProviderTokenHelpers.toProviderIdentifier(provider));
      module.update.addProvider(provider);
    });

    return module;
  }, [originalModule, componentProps?.inject]);

  useEffectOnce(() => {
    return () => {
      componentModule.dispose();
    };
  });

  return componentModule;
}
