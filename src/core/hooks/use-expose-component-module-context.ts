import { useContext } from 'react';

import { REACT_X_INJECTION_CONTEXT, REACT_X_INJECTION_EXPOSED_COMPONENT_MODULE_CONTEXT } from '../providers';

export function useExposeComponentModuleContext(): void {
  const componentModule = useContext(REACT_X_INJECTION_CONTEXT);
  const exposed = useContext(REACT_X_INJECTION_EXPOSED_COMPONENT_MODULE_CONTEXT);

  exposed.set(componentModule.ctx.toString(), componentModule.ctx);
}
