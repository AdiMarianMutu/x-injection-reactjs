import '@testing-library/jest-dom';

import { Injectable, ProviderModuleHelpers, type IProviderModuleNaked } from '@adimm/x-injection';
import { render as _render, act, fireEvent, screen, waitFor } from '@testing-library/react';
import React, { useEffect, useState } from 'react';

import {
  ComponentProviderModule,
  ModuleProvider,
  TapIntoComponent,
  useExposeComponentModuleContext,
  useInject,
  useInjectMany,
  useInjectOnRender,
  useRerenderOnChildrenModuleContextLoaded,
  type IComponentProviderModule,
  type IComponentProviderModuleNaked,
} from '../src';
import {
  AppModule,
  CatService,
  EmptyService,
  PropertiesModule,
  RandomModule,
  RandomService,
  RIP_SERVICE_NAME,
  RipService,
  TEST_ID,
  UserService,
  WithTestId,
} from './setup';

// [!!! IMPORTANT !!!]
//
// It is important that we also test the behavior a React developer would
// naturally experience while locally developing with React StrictMode enabled.
// Tests should always pass with or without having StrictMode enabled!
//
// https://react.dev/reference/react/StrictMode

describe.each([
  ['[StrictMode = false]', false],
  ['[StrictMode = true]', true],
])('%s', (_, USE_REACT_STRICT_MODE) => {
  const render = (ui: Parameters<typeof _render>['0'], options?: Parameters<typeof _render>['1']) =>
    _render(ui, { ...(options ?? {}), reactStrictMode: USE_REACT_STRICT_MODE });

  describe('Core', () => {
    afterAll(() => {
      jest.clearAllMocks();
    });

    it('should correctly render the component', async () => {
      await act(async () =>
        render(<ModuleProvider module={AppModule as any} render={() => <WithTestId></WithTestId>} />)
      );

      await waitFor(async () => {
        expect(await screen.findByTestId(TEST_ID)).toBeEmptyDOMElement();
      });
    });

    it('should correctly inject a dependency into the component from the `AppModule`', async () => {
      const testId = 'rip-service';

      await act(async () =>
        render(
          <ModuleProvider
            module={AppModule as any}
            render={() => {
              const ripService = useInject(RipService);

              return <span data-testid={testId}>{ripService.name}</span>;
            }}
          />
        )
      );

      await waitFor(async () => {
        expect(await screen.findByTestId(testId)).toHaveTextContent(RIP_SERVICE_NAME);
      });
    });

    it('should dispose the provided module on unmount', async () => {
      const m = new ComponentProviderModule({
        identifier: Symbol('DISPOSE_MODULE_ON_UNMOUNT'),
      }).toNaked();
      let componentModuleInstance: IComponentProviderModule;

      const { unmount } = await act(async () =>
        render(
          <TapIntoComponent
            contextInstance={() => ({
              tryGet: m,
              thenDo: (ctx) => {
                componentModuleInstance = ctx;
              },
            })}>
            <ModuleProvider
              module={m}
              disposeModuleOnUnmount={true}
              render={() => {
                useExposeComponentModuleContext();

                return <></>;
              }}
            />
          </TapIntoComponent>
        )
      );
      unmount();

      await waitFor(async () => {
        expect(componentModuleInstance.toNaked().container).toBe(null);
      });
    });

    it('should dispose and re-init the provided module on mount/unmount', async () => {
      const onReadyCb = jest.fn();
      const onDisposeCb = jest.fn();
      let componentModuleInstance: IComponentProviderModuleNaked & IProviderModuleNaked;

      const mo = ProviderModuleHelpers.buildInternalConstructorParams({
        identifier: Symbol('DISPOSE_&_REINIT_TEST'),
        providers: [EmptyService],
        onReady: onReadyCb,
        onDispose: onDisposeCb,
      });
      const m = new ComponentProviderModule(mo).toNaked();

      const T = () => (
        <TapIntoComponent
          contextInstance={() => ({
            tryGet: m,
            thenDo: (ctx) => {
              componentModuleInstance = ctx.toNaked();
            },
          })}>
          <ModuleProvider
            module={m}
            disposeModuleOnUnmount={true}
            tryReInitModuleOnMount={mo}
            render={() => {
              useExposeComponentModuleContext();

              return <></>;
            }}
          />
        </TapIntoComponent>
      );

      const { unmount } = await act(async () => render(<T />));
      unmount();

      await waitFor(async () => {
        expect(onDisposeCb).toHaveBeenCalledTimes(1);
        expect(componentModuleInstance.container).toBe(null);
      });

      await act(async () => render(<T />));

      await waitFor(async () => {
        expect(onReadyCb).toHaveBeenCalled();
        expect(componentModuleInstance.container).not.toBe(null);
        expect(componentModuleInstance.get(EmptyService) instanceof EmptyService).toBe(true);
      });
    });

    it('should inject multiple dependencies at once when using `useInjectMany`', async () => {
      await act(async () =>
        render(
          <ModuleProvider
            module={PropertiesModule}
            render={() => {
              const [catService, userService] = useInjectMany({ deps: [CatService, UserService] });

              return (
                <button
                  data-testid="btn"
                  onClick={() => {
                    expect(catService instanceof CatService).toBe(true);
                    expect(userService instanceof UserService).toBe(true);
                  }}>
                  update properties
                </button>
              );
            }}
          />
        )
      );

      fireEvent.click(await screen.findByTestId('btn'));
    });

    describe('Component InjectionScope', () => {
      it('each component should have its own transient dependency instance', async () => {
        const valuesGenerated: number[] = [];

        const T = () => (
          <ModuleProvider
            module={RandomModule}
            render={() => {
              const randomService = useInject(RandomService);

              valuesGenerated.push(randomService.random);

              return <></>;
            }}
          />
        );

        await act(async () => render(<T />));
        await act(async () => render(<T />));

        await waitFor(async () => {
          expect([...new Set(valuesGenerated)].length).toBeGreaterThan(1);
        });
      });

      it('should not mutate the dependency during re-renders when using `useInject`', async () => {
        const valuesGenerated: number[] = [];

        const A = () => {
          const randomService = useInject(RandomService);

          valuesGenerated.push(randomService.random);

          return <></>;
        };

        const T = () => (
          <ModuleProvider module={RandomModule}>
            <A />
          </ModuleProvider>
        );

        const { rerender } = await act(async () => render(<T />));

        [new Array(4)].forEach(() => rerender(<T />));

        await waitFor(async () => {
          expect([...new Set(valuesGenerated)].length).toBe(1);
        });
      });

      it('should re-inject dependency on each re-render when using `useInjectOnRender`', async () => {
        const valuesGenerated: number[] = [];

        function T() {
          return (
            <ModuleProvider
              module={RandomModule}
              render={() => {
                const randomService = useInjectOnRender(RandomService);

                valuesGenerated.push(randomService.random);

                return <></>;
              }}
            />
          );
        }

        const { rerender } = await act(async () => render(<T />));

        [new Array(4)].forEach(() => rerender(<T />));

        await waitFor(async () => {
          expect([...new Set(valuesGenerated)].length).toBeGreaterThan(1);
        });
      });

      it('should correctly expose to the consumer component the scoped dependencies instances from within the component context from multiple injection hooks invokations', async () => {
        let service0: CatService;
        let service1: UserService;
        let service2: RandomService;
        let service3: RipService;
        let service4: EmptyService;

        const m = new ComponentProviderModule({
          identifier: Symbol('I hate Apple products :)'),
          providers: [CatService, UserService, RandomService, RipService, EmptyService],
        });

        await act(async () =>
          render(
            <TapIntoComponent
              contextInstance={() => ({
                tryGet: m,
                thenDo: (ctx) => {
                  [service0, service1, service2, service3, service4] = ctx.getMany(
                    CatService,
                    UserService,
                    RandomService,
                    RipService,
                    EmptyService
                  );
                },
              })}>
              <ModuleProvider
                module={m}
                render={() => {
                  useExposeComponentModuleContext();

                  useInjectMany({ deps: [CatService, UserService] });
                  useInject(RandomService);
                  useInject(RipService);
                  useInjectOnRender(EmptyService);

                  return null;
                }}
              />
            </TapIntoComponent>
          )
        );

        await waitFor(async () => {
          expect(service0 instanceof CatService).toBe(true);
          expect(service1 instanceof UserService).toBe(true);
          expect(service2 instanceof RandomService).toBe(true);
          expect(service3 instanceof RipService).toBe(true);
          expect(service4 instanceof EmptyService).toBe(true);
        });
      });
    });
  });

  it('should not convert the AppModule or a disposed module to a contextualized module', async () => {});

  describe('Real World Scenarios', () => {
    afterAll(() => {
      jest.clearAllMocks();
    });

    describe('Calculator App', () => {
      afterAll(() => {
        jest.clearAllMocks();
      });

      const SUM_TEST_ID = 'sum';
      const SUB_TEST_ID = 'sub';

      @Injectable()
      class CalculatorAppService {
        updateComponentSumValue!: (n: number) => void;
        updateComponentSubValue!: (n: number) => void;

        sum(...numbers: number[]): number {
          const result = numbers.reduce((prev, curr) => prev + curr, 0);

          this.updateComponentSumValue(result);

          return result;
        }

        sub(...numbers: number[]): number {
          const result = numbers.reduce((prev, curr) => prev - curr);

          this.updateComponentSubValue(result);

          return result;
        }
      }

      const CalculatorAppModule = new ComponentProviderModule({
        identifier: Symbol('CalculatorAppModule'),
        providers: [CalculatorAppService],
      });

      const CalculatorApp = () => {
        return (
          <ModuleProvider
            module={CalculatorAppModule}
            render={() => {
              useExposeComponentModuleContext();

              const [sumValue, setSumValue] = useState(0);
              const [subValue, setSubValue] = useState(0);

              const service = useInject(CalculatorAppService);

              service.updateComponentSumValue = setSumValue;
              service.updateComponentSubValue = setSubValue;

              return (
                <>
                  <p data-testid={SUM_TEST_ID}>{sumValue}</p>
                  <p data-testid={SUB_TEST_ID}>{subValue}</p>
                </>
              );
            }}
          />
        );
      };

      it('should correctly update the component when the component consumer uses its service', async () => {
        let calculatorService0: CalculatorAppService;
        let calculatorService1: CalculatorAppService;

        await act(async () =>
          render(
            <>
              <TapIntoComponent
                contextInstance={() => ({
                  tryGet: CalculatorAppModule,
                  thenDo: (ctx) => {
                    calculatorService0 = ctx.get(CalculatorAppService);
                  },
                })}>
                <div data-testid="0">
                  <CalculatorApp />
                </div>
              </TapIntoComponent>

              <TapIntoComponent
                contextInstance={(ctxMap) => {
                  const ctx = ctxMap.get(CalculatorAppModule.toString());
                  if (!ctx) return;

                  calculatorService1 = ctx.get(CalculatorAppService);
                }}>
                <div data-testid="1">
                  <CalculatorApp />
                </div>
              </TapIntoComponent>
            </>
          )
        );

        await waitFor(async () => {
          calculatorService0.sum(22, 3, 1998);
          calculatorService0.sub(1969, 9, 29);
          calculatorService1.sum(23, 10, 1999);
          calculatorService1.sub(2028, 27);

          const sumElVal0 = (await screen.findByTestId('0')).querySelector(`p[data-testid="${SUM_TEST_ID}"]`);
          const subElVal0 = (await screen.findByTestId('0')).querySelector(`p[data-testid="${SUB_TEST_ID}"]`);
          const sumElVal1 = (await screen.findByTestId('1')).querySelector(`p[data-testid="${SUM_TEST_ID}"]`);
          const subElVal1 = (await screen.findByTestId('1')).querySelector(`p[data-testid="${SUB_TEST_ID}"]`);

          expect(sumElVal0).toHaveTextContent('2023');
          expect(subElVal0).toHaveTextContent('1931');
          expect(sumElVal1).toHaveTextContent('2032');
          expect(subElVal1).toHaveTextContent('2001');
        });
      });
    });

    describe('Composable - Nested Scoped Services', () => {
      afterAll(() => {
        jest.clearAllMocks();
      });

      @Injectable()
      class InputBoxService {
        currentText = '';

        renderText!: (t: string) => void;

        updateText(t: string) {
          this.currentText = t;

          this.renderText(t);
        }
      }

      @Injectable()
      class AutocompleteDropdownService {
        constructor(public readonly inputBoxService: InputBoxService) {}
      }

      const InputBoxModule = new ComponentProviderModule({
        identifier: Symbol('InputBoxModule'),
        providers: [InputBoxService],
        exports: [InputBoxService],
      });

      const AutocompleteDropdownModule = new ComponentProviderModule({
        identifier: Symbol('AutocompleteDropdownModule'),
        imports: [InputBoxModule],
        providers: [AutocompleteDropdownService],
        exports: [AutocompleteDropdownService],
      });

      const INPUT_BOX_TEXT = 'Hello World!';

      const InputBox = () => (
        <ModuleProvider
          module={InputBoxModule}
          render={() => {
            useExposeComponentModuleContext();

            const [text, setText] = useState('');

            const service = useInject(InputBoxService);

            service.renderText = setText;

            useEffect(() => {
              service.updateText(INPUT_BOX_TEXT);
            }, []);

            return <input data-testid="input-box" value={text} onChange={(e) => service.updateText(e.target.value)} />;
          }}
        />
      );

      const AutocompleteDropdown = () => {
        return (
          <ModuleProvider
            module={AutocompleteDropdownModule}
            render={() => {
              useRerenderOnChildrenModuleContextLoaded();

              const service = useInjectOnRender(AutocompleteDropdownService);

              return (
                <>
                  <InputBox />

                  <span data-testid="dropdown">{service.inputBoxService.currentText}</span>
                </>
              );
            }}
          />
        );
      };

      it('should automatically resolve the parent service dependencies from the children context module by using the `useRerenderOnChildrenModuleContextLoaded` hook', async () => {
        await act(async () => render(<AutocompleteDropdown />));

        const dropdownEl = await screen.findByTestId('dropdown');

        await waitFor(async () => {
          expect(dropdownEl).toHaveTextContent('Hello World!');
        });
      });
    });
  });
});
