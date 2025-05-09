import { useContext, useEffect } from 'react';

import { useRerender } from '../../helpers';
import type { IComponentProviderModuleNaked } from '../../types';
import { REACT_X_INJECTION_CONTEXT, REACT_X_INJECTION_EXPOSED_COMPONENT_MODULE_CONTEXT } from '../react-context';

/**
 * This is an **experimental** hook which can be used to make sure that a component will re-render when a children
 * exposes its internal context module.
 *
 * It works best with the `useInjectOnRender` hook, as it'll re-resolve all the required dependencies
 * of the injected ProviderToken.
 *
 * **Use it carefully as it may lead to unnecessary re-render cycles or it may even not work as expected!**
 * **It's safer to use the `TapIntoComponent` wrapper component with the `contextInstance` to manually inject the**
 * **contextualized dependencies of the children into a parent component service!**
 *
 * @experimental
 */
export function useRerenderOnChildrenModuleContextLoaded(): void {
  const parentModule = useContext(REACT_X_INJECTION_CONTEXT);
  const ctxMap = useContext(REACT_X_INJECTION_EXPOSED_COMPONENT_MODULE_CONTEXT);

  const rerenderComponent = useRerender();

  useEffect(() => {
    const parentModuleNaked = parentModule.ctx.toNaked();

    const contextualizedImportedModules = parentModuleNaked.imports.map((importedModule) => {
      const importedModuleId = importedModule.toString();

      const shouldReplaceImportedModuleWithContextualized =
        ctxMap.get(importedModuleId)?.toString() === importedModuleId;

      /* istanbul ignore next */
      if (!shouldReplaceImportedModuleWithContextualized)
        return importedModule as unknown as IComponentProviderModuleNaked;

      return ctxMap.get(importedModuleId) as IComponentProviderModuleNaked;
    });

    if (contextualizedImportedModules.length > 0) {
      parentModuleNaked._lazyInit({
        ...parentModuleNaked._initialOptions,
        imports: contextualizedImportedModules,
      });

      rerenderComponent();
    }
  }, [parentModule, ctxMap]);
}
