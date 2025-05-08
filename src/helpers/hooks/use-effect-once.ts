import { useEffect, useRef, useState } from 'react';

// Credits: https://stackoverflow.com/a/74000921

/** Custom {@link useEffect} hook which will be run once. _(In `StrictMode` as well)_ */
export function useEffectOnce(effect: () => React.EffectCallback) {
  const destroyFunc = useRef<React.EffectCallback>(undefined);
  const effectCalled = useRef(false);
  const renderAfterCalled = useRef(false);
  const [, forceRerender] = useState(0);

  if (effectCalled.current) renderAfterCalled.current = true;

  useEffect(() => {
    // only execute the effect first time around
    if (!effectCalled.current) {
      destroyFunc.current = effect();
      effectCalled.current = true;
    }

    // this forces one render after the effect is run
    forceRerender((x) => x + 1);

    return () => {
      // if the comp didn't render since the useEffect was called,
      // we know it's the dummy React cycle
      if (!renderAfterCalled.current) return;

      destroyFunc.current?.();
    };
  }, []);
}
