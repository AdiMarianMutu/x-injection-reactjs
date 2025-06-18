import type { IProviderModule } from '@adimm/x-injection';
import { useContext } from 'react';

import { REACT_X_INJECTION_PROVIDER_MODULE_CONTEXT } from '../react-context';

/** Can be used to retrieve the {@link IProviderModule | Module} from the current context. */
export function useComponentModule(): IProviderModule {
  return useContext(REACT_X_INJECTION_PROVIDER_MODULE_CONTEXT);
}
