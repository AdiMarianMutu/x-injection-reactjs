import { useCallback } from 'react';
import type { Except } from 'type-fest';

import { useEffectOnce } from '../../../helpers';
import type { IComponentProviderModule } from '../../../types';
import { REACT_X_INJECTION_CONTEXT } from '../../react-context';
import type { ModuleProviderProps } from './models';

export function ModuleProvider({
  children,
  render,
  module,
  tryReInitModuleOnMount,
  disposeModuleOnUnmount,
}: ModuleProviderProps) {
  const isAppModule = module.toNaked().isAppModule;
  const Renderer = useCallback(() => render?.(), []);

  const moduleCtxReference = {
    ctx: isAppModule ? module : module.toNaked()._convertToContextualizedComponentInstance(),
  };

  return (
    <REACT_X_INJECTION_CONTEXT.Provider value={moduleCtxReference}>
      <XInjectionChildrenRenderer
        children={children ?? <Renderer />}
        module={moduleCtxReference}
        tryReInitModuleOnMount={tryReInitModuleOnMount}
        disposeModuleOnUnmount={disposeModuleOnUnmount}
      />
    </REACT_X_INJECTION_CONTEXT.Provider>
  );
}

function XInjectionChildrenRenderer({
  children,
  module,
  tryReInitModuleOnMount,
  disposeModuleOnUnmount = false,
}: Except<ModuleProviderProps, 'module'> & { module: { ctx: IComponentProviderModule } }) {
  // We use the `useEffectOnce` custom hook in order
  // to make sure that if the developer is providing the
  // `tryReInitModuleOnMount` and/or `disposeModuleOnUnmount` options
  // we do not early dispose the module when React double re-renders the
  // component while StrictMode is enabled.
  // This hook guarantees that the same behavior is expected with or without StrictMode.
  //
  // https://react.dev/reference/react/StrictMode
  useEffectOnce(() => {
    // ON MOUNT

    const moduleNaked = module.ctx.toNaked();

    /* istanbul ignore next */
    if (moduleNaked.isDisposed && tryReInitModuleOnMount) {
      /* istanbul ignore next */
      moduleNaked._lazyInit(tryReInitModuleOnMount);
    }

    return () => {
      // ON UNMOUNT

      if (!disposeModuleOnUnmount || moduleNaked.isDisposed) return;

      moduleNaked._dispose();
    };
  });

  return children;
}
