import { AppModule } from '@adimm/x-injection';
import { createContext } from 'react';

import type { IComponentProviderModule } from '../types';

export const REACT_X_INJECTION_PROVIDER_MODULE_CONTEXT = createContext<IComponentProviderModule>(AppModule as any);
