import { useContext, useEffect, useMemo } from 'react';
import type { Except } from 'type-fest';

import { REACT_X_INJECTION_EXPOSED_COMPONENT_MODULE_CONTEXT } from '../../react-context';
import type { TapIntoComponentContextProps } from './interfaces';

/**
 * This component is the standard way to "tap into" an instance of the component
 * in order to get access to its scoped module container and its _(exposed)_ dependencies _instances_.
 *
 * @param contextInstance See {@link TapIntoComponentContextProps.contextInstance}.
 * @param exposed See {@link TapIntoComponentContextProps.exposed}.
 */
export function TapIntoComponent({ children, contextInstance }: TapIntoComponentContextProps) {
  const moduleContextMap = useMemo(() => new Map(), []);

  return (
    <REACT_X_INJECTION_EXPOSED_COMPONENT_MODULE_CONTEXT.Provider value={moduleContextMap}>
      <CtxExposer contextInstance={contextInstance} />
      {children}
    </REACT_X_INJECTION_EXPOSED_COMPONENT_MODULE_CONTEXT.Provider>
  );
}

function CtxExposer({ contextInstance }: Except<TapIntoComponentContextProps, 'children'>) {
  const ctxMap = useContext(REACT_X_INJECTION_EXPOSED_COMPONENT_MODULE_CONTEXT);

  useEffect(() => {
    const fluidSyntax = contextInstance?.(ctxMap);
    if (!fluidSyntax) return;

    const moduleCtx = ctxMap.get(fluidSyntax.tryGet.toString());
    /* istanbul ignore next */
    if (!moduleCtx) return;

    fluidSyntax.thenDo(moduleCtx);
  }, [ctxMap]);

  return null;
}
