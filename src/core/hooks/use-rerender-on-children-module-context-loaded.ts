import { useContext, useEffect, useState } from 'react';

import { REACT_X_INJECTION_EXPOSED_COMPONENT_RERENDER_ON_CTX_CHANGE } from '../react-context';

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
  const rerenderParentCtx = useContext(REACT_X_INJECTION_EXPOSED_COMPONENT_RERENDER_ON_CTX_CHANGE);
  const [, setRerender] = useState(0);

  useEffect(() => {
    setRerender((x) => x + 1);
  }, [rerenderParentCtx.r]);
}
