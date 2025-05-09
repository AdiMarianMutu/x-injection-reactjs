import { AppModule } from '@adimm/x-injection';
import { createContext } from 'react';

import type { IComponentProviderModule } from '../types';

/**
 * The `React.Context` value to be provided to a `React.Provider`.
 *
 * Its default value is a reference to the {@link AppModule}.
 */
export const REACT_X_INJECTION_CONTEXT = createContext<{ ctx: IComponentProviderModule }>(AppModule as any);

export const REACT_X_INJECTION_EXPOSED_COMPONENT_MODULE_CONTEXT = createContext<Map<string, IComponentProviderModule>>(
  new Map()
);
