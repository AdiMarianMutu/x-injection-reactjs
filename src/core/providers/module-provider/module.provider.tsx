import { useCallback, useContext } from 'react';
import type { Except } from 'type-fest';

import { useEffectOnce } from '../../../helpers';
import type { IComponentProviderModule, IComponentProviderModuleNaked } from '../../../types';
import {
  REACT_X_INJECTION_CONTEXT,
  REACT_X_INJECTION_EXPOSED_COMPONENT_MODULE_CONTEXT,
  REACT_X_INJECTION_EXPOSED_COMPONENT_RERENDER_ON_CTX_CHANGE,
} from '../../react-context';
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
      <REACT_X_INJECTION_EXPOSED_COMPONENT_RERENDER_ON_CTX_CHANGE.Provider value={{ r: 0 }}>
        <XInjectionChildrenRenderer
          children={children ?? <Renderer />}
          module={moduleCtxReference}
          tryReInitModuleOnMount={tryReInitModuleOnMount}
          disposeModuleOnUnmount={disposeModuleOnUnmount}
        />
      </REACT_X_INJECTION_EXPOSED_COMPONENT_RERENDER_ON_CTX_CHANGE.Provider>
    </REACT_X_INJECTION_CONTEXT.Provider>
  );
}

function XInjectionChildrenRenderer({
  children,
  module,
  tryReInitModuleOnMount,
  disposeModuleOnUnmount = false,
}: Except<ModuleProviderProps, 'module'> & { module: { ctx: IComponentProviderModule } }) {
  const componentModuleInstance = useContext(REACT_X_INJECTION_EXPOSED_COMPONENT_MODULE_CONTEXT);
  const rerenderParentCtx = useContext(REACT_X_INJECTION_EXPOSED_COMPONENT_RERENDER_ON_CTX_CHANGE);

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

    if (componentModuleInstance) {
      const contextualizedImportedModules = module.ctx.toNaked().imports.map((importedModule) => {
        const shouldReplaceImportedModuleWithContextualized =
          componentModuleInstance.get(importedModule.toString())?.toString() === importedModule.toString();

        /* istanbul ignore next */
        if (!shouldReplaceImportedModuleWithContextualized)
          return importedModule as unknown as IComponentProviderModuleNaked;

        return componentModuleInstance.get(importedModule.toString()) as IComponentProviderModuleNaked;
      });

      if (contextualizedImportedModules.length > 0) {
        module.ctx.toNaked()._lazyInit({
          ...module.ctx.toNaked()._initialOptions,
          imports: contextualizedImportedModules,
        });

        // This will force the parent to re-render when using the `useRerenderOnChildrenModuleContextLoaded` hook.
        rerenderParentCtx.r++;
      }
    }

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
