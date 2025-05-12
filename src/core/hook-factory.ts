import type { ProviderToken } from '@adimm/x-injection';
import { useMemo } from 'react';

import { XInjectionHookFactoryError } from '../errors';
import { useComponentModule } from './hooks';

export function hookFactory<P extends HookParams, D extends any[], T>({
  use: hook,
  inject,
}: HookFactoryParams<P, D, T>): (p: P) => T {
  return (p: P) => {
    const componentModule = useComponentModule();

    const deps = useMemo(() => {
      if (inject.length === 0) {
        throw new XInjectionHookFactoryError(componentModule, `The 'deps' property array is missing!`);
      }

      return componentModule.getMany(...inject);
    }, [inject]);

    return hook({ ...p, deps: [...deps] } as any);
  };
}

export interface HookFactoryParams<P extends HookParams, D extends any[], T> {
  use: HookWithProviderModuleDependencies<P, D, T>;
  inject: ProviderToken[];
}

export type HookWithProviderModuleDependencies<P extends HookParams, D extends any[], T> = (p: HookWithDeps<P, D>) => T;

export type HookWithDeps<P extends HookParams, D extends any[]> = P & {
  /** Array containing the resolved dependencies from the component context. */
  deps: D;
};

type HookParams = Record<string, any> | void;
