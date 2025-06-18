import { AppModule, IProviderModule } from '@adimm/x-injection';
import { createContext } from 'react';

export const REACT_X_INJECTION_PROVIDER_MODULE_CONTEXT = createContext<IProviderModule>(AppModule);
