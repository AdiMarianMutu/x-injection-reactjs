// Document the direct public API exports.
export type * from './index';

// If Typedoc is unable to automatically export some internal modules
// export them manually here.

// [TO-DO]: Find a better way to automatically reference the `JSDoc` types from the base `x-injection` library.
export type * as Types from '@adimm/x-injection';
