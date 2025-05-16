import '@testing-library/jest-dom';

import { Injectable, InjectionScope } from '@adimm/x-injection';
import { render as _render, act, fireEvent, screen, waitFor } from '@testing-library/react';
import React, { useEffect, useState } from 'react';

import {
  ComponentProviderModule,
  hookFactory,
  HookWithDeps,
  PropsWithModule,
  ProvideModule,
  provideModuleToComponent,
  useInject,
  useInjectMany,
  type IComponentProviderModule,
} from '../src';
import { InjectionHookFactoryError } from '../src/errors';
import { GlobalModule, GlobalService, RandomModule, RandomService, UserModule, UserService } from './setup';

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
    const user = {
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should correctly resolve from the `AppModule`', () => {
      expect(RandomModule.get(GlobalService) instanceof GlobalService).toBe(true);
    });

    it('should correctly resolve from the `AppModule` from within a component NOT wrapped into a `ProviderModule`', async () => {
      let serviceFromComponent: GlobalService;

      const C = () => {
        serviceFromComponent = useInject(GlobalService);

        return null;
      };

      await act(async () => render(<C />));

      await waitFor(async () => {
        expect(serviceFromComponent).toBe(RandomModule.get(GlobalService));
      });
    });

    describe('Module Provider', () => {
      const TEST_ID = 'module-provider';

      it('should use the `provideModule` arrow function', async () => {
        const C = provideModuleToComponent(UserModule, ({ firstName, lastName }: typeof user) => {
          const service = useInject(UserService);

          return <h1 data-testid={TEST_ID}>Hello {service.generateFullName(firstName, lastName)}</h1>;
        });

        await act(async () => render(<C firstName={user.firstName} lastName={user.lastName} />));

        await waitFor(async () => {
          expect(await screen.findByTestId(TEST_ID)).toHaveTextContent(`Hello ${user.firstName} ${user.lastName}`);
        });
      });

      it('should use the `ProvideModule` component function', async () => {
        function MyComponent({ firstName, lastName }: PropsWithModule<typeof user>) {
          const service = useInject(UserService);

          return <h1 data-testid={TEST_ID}>Hello {service.generateFullName(firstName, lastName)}</h1>;
        }

        function App() {
          return (
            <ProvideModule module={UserModule}>
              <MyComponent firstName={user.firstName} lastName={user.lastName} />
            </ProvideModule>
          );
        }

        await act(async () => render(<App />));

        await waitFor(async () => {
          expect(await screen.findByTestId(TEST_ID)).toHaveTextContent(`Hello ${user.firstName} ${user.lastName}`);
        });
      });
    });

    describe('Performance', () => {
      describe('ProviderModule', () => {
        it('should not cause an immediate re-render', async () => {
          let cnt = 0;

          function MyComponent() {
            cnt++;

            return null;
          }

          function App() {
            return (
              <ProvideModule module={UserModule}>
                <MyComponent />
              </ProvideModule>
            );
          }

          await act(async () => render(<App />));

          await waitFor(async () => {
            expect(cnt).toBe(
              // When strict mode is enabled react will automatically double mount the component
              USE_REACT_STRICT_MODE ? 2 : 1
            );
          });
        });

        it('should cause a re-render only on props change', async () => {
          let cnt = 0;

          function _MyComponent({ value }: any) {
            cnt++;
            return null;
          }

          const MyComponent = React.memo(_MyComponent);

          function App({ value }: any) {
            return (
              <ProvideModule module={UserModule}>
                <MyComponent value={value} />
              </ProvideModule>
            );
          }

          const { rerender } = render(<App value={1} />);

          await waitFor(() => {
            expect(cnt).toBe(USE_REACT_STRICT_MODE ? 2 : 1);
          });

          cnt = 0;

          rerender(<App value={2} />);

          await waitFor(() => {
            // When strict mode is enabled react will automatically double mount the component
            expect(cnt).toBe(USE_REACT_STRICT_MODE ? 2 : 1);
          });
        });
      });

      describe('provideModuleToComponent', () => {
        it('should not cause an immediate re-render', async () => {
          let cnt = 0;

          const MyComponent = provideModuleToComponent(UserModule, () => {
            cnt++;

            return null;
          });

          function App() {
            return <MyComponent />;
          }

          await act(async () => render(<App />));

          await waitFor(async () => {
            expect(cnt).toBe(
              // When strict mode is enabled react will automatically double mount the component
              USE_REACT_STRICT_MODE ? 2 : 1
            );
          });
        });

        it('should cause a re-render only on props change', async () => {
          let cnt = 0;

          const MyComponent = React.memo(
            provideModuleToComponent(UserModule, ({ value }: any) => {
              cnt++;
              return null;
            })
          );

          function App({ value }: { value: number }) {
            return <MyComponent value={value} />;
          }

          const { rerender } = render(<App value={1} />);

          await waitFor(() => {
            expect(cnt).toBe(USE_REACT_STRICT_MODE ? 2 : 1);
          });

          cnt = 0;

          rerender(<App value={2} />);

          await waitFor(() => {
            // When strict mode is enabled react will automatically double mount the component
            expect(cnt).toBe(USE_REACT_STRICT_MODE ? 2 : 1);
          });
        });
      });
    });

    describe('Injection Scope', () => {
      describe('Singleton', () => {
        it('should be the same instance between re-renders', async () => {
          const randomValues: number[] = [];

          const C = provideModuleToComponent(RandomModule, () => {
            const service = useInject(RandomService);

            randomValues.push(service.random);

            return null;
          });

          const { rerender } = await act(async () => render(<C />));
          rerender(<C />);

          await waitFor(async () => {
            expect([...new Set(randomValues)].length).toBe(1);
          });
        });
      });

      describe('Transient', () => {
        const RandomServiceTransientModule = new ComponentProviderModule({
          identifier: Symbol('RandomServiceSingletonModule'),
          providers: [
            {
              provide: RandomService,
              useClass: RandomService,
              scope: InjectionScope.Transient,
            },
          ],
        });

        it('should NOT be the same instance between re-renders', async () => {
          const randomValues: number[] = [];

          const C = provideModuleToComponent(RandomServiceTransientModule, () => {
            const service = useInject(RandomService);

            randomValues.push(service.random);

            return null;
          });

          const { rerender } = await act(async () => render(<C />));
          await act(async () => rerender(<C />));

          await waitFor(async () => {
            expect([...new Set(randomValues)].length).toBeGreaterThan(1);
          });
        });
      });

      describe('Request', () => {
        @Injectable()
        class Service {
          random = Math.random();

          constructor(
            readonly rndService0: RandomService,
            readonly rndService1: RandomService
          ) {}
        }

        const ServiceRequestModule = new ComponentProviderModule({
          identifier: Symbol('RandomServiceSingletonModule'),
          defaultScope: InjectionScope.Request,
          providers: [Service, RandomService],
        });

        it('should NOT be the same instance between re-renders but constructor dependencies should be of the same instance', async () => {
          const mainRandomValues: number[] = [];
          const randomValues = {
            from1stService: undefined as unknown as number,
            from2ndService: undefined as unknown as number,
          };

          const C = provideModuleToComponent(ServiceRequestModule, () => {
            const service = useInject(Service);

            mainRandomValues.push(service.random);
            randomValues.from1stService = service.rndService0.random;
            randomValues.from2ndService = service.rndService1.random;

            return null;
          });

          const { rerender } = await act(async () => render(<C />));

          await waitFor(async () => {
            expect(randomValues.from1stService).toBe(randomValues.from2ndService);
          });

          await act(async () => rerender(<C />));

          await waitFor(async () => {
            expect(randomValues.from1stService).toBe(randomValues.from2ndService);
            expect([...new Set(mainRandomValues)].length).toBeGreaterThan(1);
          });
        });
      });
    });

    describe('Hooks', () => {
      @Injectable()
      class BaseService {
        value = '';
      }

      @Injectable()
      class InnerService {
        constructor(readonly baseService: BaseService) {
          // Should override also the `BaseService` original class value when `InnerService` is resolved
          this.baseService.value = 'Hello';
        }
      }

      const BaseModule = new ComponentProviderModule({
        identifier: Symbol('HookBaseModule'),
        providers: [BaseService],
        exports: [BaseService],
      });

      const InnerModule = new ComponentProviderModule({
        identifier: Symbol('HookInnerModule'),
        providers: [InnerService],
        imports: [BaseModule, RandomModule, UserModule],
      });

      it('should inject multiple dependencies at once when using `useInjectMany`', async () => {
        const C = provideModuleToComponent(InnerModule, () => {
          const [baseService, innerService, userService, UNDEFINED_DEP] = useInjectMany(
            BaseService,
            InnerService,
            UserService,
            {
              provider: 'UNDEFINED_DEP',
              isOptional: true,
            }
          );

          return (
            <button
              data-testid="btn"
              onClick={() => {
                expect(baseService instanceof BaseService).toBe(true);
                expect(innerService instanceof InnerService).toBe(true);
                expect(userService instanceof UserService).toBe(true);
                expect(UNDEFINED_DEP).toBeUndefined();
              }}>
              assert
            </button>
          );
        });

        await act(async () => render(<C />));

        fireEvent.click(await screen.findByTestId('btn'));
      });

      describe('Factory', () => {
        it('should throw an error while trying to compose an hook without dependencies', async () => {
          const useHookError = hookFactory({
            use: () => {},
            inject: [],
          });

          const C = provideModuleToComponent(InnerModule, () => {
            useHookError();

            return null;
          });

          expect(() => render(<C />)).toThrow(InjectionHookFactoryError);
        });

        it('should successfully compose a custom hook with injected dependencies', async () => {
          const useGenerateUserId = hookFactory({
            use: ({
              firstName,
              lastName,
              deps: [userService, randomService],
            }: HookWithDeps<typeof user, [UserService, RandomService]>) => {
              return {
                id: randomService.random,
                fullName: `${userService.generateFullName(firstName, lastName)}`,
              };
            },
            inject: [UserService, RandomService],
          });

          const C = provideModuleToComponent(InnerModule, ({ firstName, lastName }: typeof user) => {
            const user = useGenerateUserId({ firstName, lastName });

            return (
              <h1>
                <p data-testid="user-id">{user.id}</p>
                <p data-testid="full-name">{user.fullName}</p>
              </h1>
            );
          });

          await act(async () => render(<C firstName={user.firstName} lastName={user.lastName} />));

          await waitFor(async () => {
            expect(Number((await screen.findByTestId('user-id')).innerHTML)).not.toBeNaN();
            expect(await screen.findByTestId('full-name')).toHaveTextContent(`${user.firstName} ${user.lastName}`);
          });
        });

        it('should successfully compose a nested custom hook with injected dependencies', async () => {
          const useGenerateUserId = hookFactory({
            use: ({
              firstName,
              lastName,
              deps: [, baseService, userService, randomService],
            }: HookWithDeps<typeof user, [InnerService, BaseService, UserService, RandomService]>) => {
              return {
                id: randomService.random,
                greetings: `${baseService.value} ${userService.generateFullName(firstName, lastName)}`,
              };
            },
            inject: [InnerService, BaseService, UserService, RandomService],
          });

          const C = provideModuleToComponent(InnerModule, ({ firstName, lastName }: typeof user) => {
            const user = useGenerateUserId({ firstName, lastName });

            return (
              <h1>
                <p data-testid="user-id">{user.id}</p>
                <p data-testid="greetings">{user.greetings}</p>
              </h1>
            );
          });

          await act(async () => render(<C firstName={user.firstName} lastName={user.lastName} />));

          await waitFor(async () => {
            expect(Number((await screen.findByTestId('user-id')).innerHTML)).not.toBeNaN();
            expect(await screen.findByTestId('greetings')).toHaveTextContent(
              `Hello ${user.firstName} ${user.lastName}`
            );
          });
        });
      });
    });

    describe('Imports scope', () => {
      it('should reference to the same children (component) module (if singleton) when `contextualizeImports` is `false`', async () => {
        const userServicesPushedFromComponents: UserService[] = [];

        @Injectable()
        class BaseService {
          constructor(public readonly userService: UserService) {
            this.userService.firstName = 'Base FirstName';
            this.userService.lastName = 'Base LastName';
          }
        }

        const Base = new ComponentProviderModule({
          identifier: Symbol('Base'),
          contextualizeImports: false,
          imports: [UserModule],
          providers: [BaseService],
        });

        const Children = provideModuleToComponent<{ testId: string }>(UserModule, ({ testId }) => {
          const service = useInject(UserService);

          userServicesPushedFromComponents.push(service);

          return (
            <span data-testid={testId}>
              {service.firstName} {service.lastName}
            </span>
          );
        });

        const Parent = provideModuleToComponent<{ testId: string; firstName: string; lastName: string }>(
          Base,
          ({ testId, firstName, lastName, module }) => {
            const service = useInject(BaseService);

            service.userService.firstName = firstName;
            service.userService.lastName = lastName;

            return <Children testId={testId} module={module} />;
          }
        );

        await act(async () => {
          render(
            <>
              <Parent testId="0" firstName="A" lastName="B" />
              <Parent testId="1" firstName="C" lastName="D" />
            </>
          );
        });

        await waitFor(async () => {
          // At render time this should still show the correct values
          // but the underlying `UserService` should have its `firstName` and `lastName` properties
          // overriden by the last rendered `Parent` component
          expect(await screen.findByTestId('0')).toHaveTextContent('A B');
          expect(await screen.findByTestId('1')).toHaveTextContent('C D');

          // Here we should see that the `Children` component was actually using
          // the service from its original module. (Which happens to be a singleton)
          expect(userServicesPushedFromComponents[0]).toBe(
            userServicesPushedFromComponents[!USE_REACT_STRICT_MODE ? 1 : 2]
          );
        });
      });

      it('should correctly NOT reference to the same children (component) module (if singleton) when `contextualizeImports` is `true`', async () => {
        const userServicesPushedFromComponents: UserService[] = [];

        @Injectable()
        class BaseService {
          constructor(public readonly userService: UserService) {
            this.userService.firstName = 'Base FirstName';
            this.userService.lastName = 'Base LastName';
          }
        }

        const Base = new ComponentProviderModule({
          identifier: Symbol('Base'),
          contextualizeImports: true, // True by default
          imports: [UserModule],
          providers: [BaseService],
        });

        const Children = provideModuleToComponent<{ testId: string }>(UserModule, ({ testId }) => {
          const service = useInject(UserService);

          userServicesPushedFromComponents.push(service);

          return (
            <span data-testid={testId}>
              {service.firstName} {service.lastName}
            </span>
          );
        });

        const Parent = provideModuleToComponent<{ testId: string; firstName: string; lastName: string }>(
          Base,
          ({ testId, firstName, lastName, module }) => {
            const service = useInject(BaseService);

            service.userService.firstName = firstName;
            service.userService.lastName = lastName;

            return <Children testId={testId} module={module} />;
          }
        );

        await act(async () => {
          render(
            <>
              <Parent testId="0" firstName="A" lastName="B" />
              <Parent testId="1" firstName="C" lastName="D" />
            </>
          );
        });

        await waitFor(async () => {
          expect(await screen.findByTestId('0')).toHaveTextContent('A B');
          expect(await screen.findByTestId('1')).toHaveTextContent('C D');

          expect(userServicesPushedFromComponents[0]).not.toBe(
            userServicesPushedFromComponents[!USE_REACT_STRICT_MODE ? 1 : 2]
          );
        });
      });
    });

    describe('Parent inheritance', () => {
      it('AutoComplete -> Inputbox & (Dropdown -> ListView)', async () => {
        const dropdownNumberOfItems = 10;
        const dropdownDefaultValue = 'Hello World!';
        let autocompleteServiceA!: AutoCompleteService;
        let autocompleteServiceB!: AutoCompleteService;

        //#region ListView Component

        @Injectable()
        class ListViewService {
          numberOfItems = 0;

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          setNumberOfItems(n: number): void {
            throw new Error('NOT IMPLEMENTED');
          }
        }

        const ListViewModule = new ComponentProviderModule({
          identifier: Symbol('ListViewModule'),
          providers: [ListViewService],
          exports: [ListViewService],
        });

        const ListViewComponent = provideModuleToComponent(ListViewModule, () => {
          const service = useInject(ListViewService);
          const [, setNumberOfItems] = useState(service.numberOfItems);

          service.setNumberOfItems = (n: number) => {
            service.numberOfItems = n;
            setNumberOfItems(n);
          };

          return <div data-testid="list-view">{service.numberOfItems}</div>;
        });

        //#endregion

        //#region Dropdown Component

        @Injectable()
        class DropdownService {
          constructor(readonly listViewService: ListViewService) {
            // Should be overriden by the `AutoComplete` service with the value from `dropdownNumberOfItems`
            this.listViewService.numberOfItems = 5;
          }
        }

        const DropdownModule = new ComponentProviderModule({
          identifier: Symbol('DropdownModule'),
          imports: [ListViewModule],
          providers: [DropdownService],
          exports: [ListViewModule, DropdownService],
        });

        const DropdownComponent = ({ module }: { module?: IComponentProviderModule }) => {
          return (
            <div data-test="dropdown">
              <ListViewComponent module={module} />
            </div>
          );
        };

        //#endregion

        //#region Inputbox Component

        @Injectable()
        class InputboxService {
          value = '';
        }

        const InputboxModule = new ComponentProviderModule({
          identifier: Symbol('InputboxModule'),
          providers: [InputboxService],
          exports: [InputboxService],
        });

        const InputboxComponent = provideModuleToComponent(
          InputboxModule,
          ({ defaultValue }: { defaultValue: string }) => {
            const service = useInject(InputboxService);

            useEffect(() => {
              service.value = defaultValue;
            }, []);

            return (
              <input
                data-testid="inputbox"
                value={service.value}
                onChange={(e) => {
                  service.value = e.currentTarget.value;
                }}
              />
            );
          }
        );

        //#endregion

        //#region AutoComplete Component

        @Injectable()
        class AutoCompleteService {
          constructor(
            readonly inputboxService: InputboxService,
            readonly dropdownService: DropdownService
          ) {
            this.dropdownService.listViewService.numberOfItems = dropdownNumberOfItems;
          }
        }

        const AutoCompleteModule = new ComponentProviderModule({
          identifier: Symbol('AutoCompleteModule'),
          imports: [InputboxModule, DropdownModule],
          providers: [AutoCompleteService],
          exports: [AutoCompleteService],
        });

        const AutoCompleteComponent = provideModuleToComponent<{
          testId: string;
          serCb?: (ser: AutoCompleteService) => void;
        }>(AutoCompleteModule, ({ module, testId, serCb }) => {
          const service = useInject(AutoCompleteService);
          serCb?.(service);

          return (
            <div data-testid={testId}>
              <InputboxComponent defaultValue={dropdownDefaultValue} module={module} />
              <ProvideModule module={module!}>
                <DropdownComponent />
              </ProvideModule>
            </div>
          );
        });

        //#endregion

        const { rerender } = await act(async () =>
          render(<AutoCompleteComponent testId="a" serCb={(x) => (autocompleteServiceA = x)} />)
        );

        await waitFor(async () => {
          expect(Number((await screen.findByTestId('list-view')).innerHTML)).toBe(dropdownNumberOfItems);
        });

        act(() => {
          autocompleteServiceA.dropdownService.listViewService.setNumberOfItems(22032013);
        });

        await waitFor(async () => {
          expect(Number((await screen.findByTestId('list-view')).innerHTML)).toBe(22032013);
        });

        await act(async () => rerender(<AutoCompleteComponent testId="a" />));

        await waitFor(async () => {
          expect(Number((await screen.findByTestId('list-view')).innerHTML)).toBe(22032013);
        });

        ///////

        const { rerender: rerender2 } = await act(async () =>
          render(<AutoCompleteComponent testId="b" serCb={(x) => (autocompleteServiceB = x)} />)
        );

        await waitFor(async () => {
          expect(Number((await screen.findByTestId('b'))!.querySelector('[data-testid="list-view"]')!.innerHTML)).toBe(
            dropdownNumberOfItems
          );
        });

        act(() => {
          autocompleteServiceB.dropdownService.listViewService.setNumberOfItems(22031998);
        });

        await waitFor(async () => {
          expect(Number((await screen.findByTestId('b'))!.querySelector('[data-testid="list-view"]')!.innerHTML)).toBe(
            22031998
          );
        });

        await act(async () => rerender2(<AutoCompleteComponent testId="b" />));

        await waitFor(async () => {
          expect(Number((await screen.findByTestId('b'))!.querySelector('[data-testid="list-view"]')!.innerHTML)).toBe(
            22031998
          );
        });
      });
    });

    describe('Component Life Cycle', () => {
      it('should NOT create a `Contextualized Module` when (the module) is marked as global', async () => {
        const GlobalModuleClone = GlobalModule.clone(); // Using clone to avoid disposing the `GlobalModule`
        const serviceFromGlobalModule = GlobalModuleClone.get(GlobalService);
        let serviceFromComponent: GlobalService;

        const C = provideModuleToComponent(GlobalModuleClone, () => {
          serviceFromComponent = useInject(GlobalService);

          return null;
        });

        await act(async () => render(<C />));

        await waitFor(async () => {
          expect(serviceFromComponent).toBe(serviceFromGlobalModule);
          // expect(serviceFromComponent).toBe(AppModule.get(GlobalService)); // This would NOT fail if `.clone()` was not used.
        });
      });

      describe('ProvideModule', () => {
        it('should dispose the contextualized module on unmount', async () => {
          let isDisposed = false;

          const m = new ComponentProviderModule({
            identifier: Symbol('DISPOSE_MODULE_ON_UNMOUNT'),
            onDispose: async () => {
              isDisposed = true;
            },
          }).toNaked();

          const { unmount } = await act(async () =>
            render(
              <ProvideModule module={m}>
                <></>
              </ProvideModule>
            )
          );

          unmount();

          await waitFor(async () => {
            expect(isDisposed).toBe(true);
          });
        });

        it('should dispose the contextualized module on unmount and create a new on on mount', async () => {
          let isDisposed = false;

          const m = new ComponentProviderModule({
            identifier: Symbol('DISPOSE_MODULE_ON_UNMOUNT'),
            onReady: async () => {
              isDisposed = false;
            },
            onDispose: async () => {
              isDisposed = true;
            },
          }).toNaked();

          const { unmount } = await act(async () =>
            render(
              <ProvideModule module={m}>
                <></>
              </ProvideModule>
            )
          );

          unmount();

          await waitFor(async () => {
            expect(isDisposed).toBe(true);
          });

          await act(async () =>
            render(
              <ProvideModule module={m}>
                <></>
              </ProvideModule>
            )
          );

          await waitFor(async () => {
            expect(isDisposed).toBe(false);
          });
        });
      });

      describe('provideModuleToComponent', () => {
        it('should dispose the contextualized module on unmount', async () => {
          let isDisposed = false;

          const m = new ComponentProviderModule({
            identifier: Symbol('DISPOSE_MODULE_ON_UNMOUNT'),
            onDispose: async () => {
              isDisposed = true;
            },
          }).toNaked();

          const C = provideModuleToComponent(m, () => null);

          const { unmount } = await act(async () => render(<C />));

          unmount();

          await waitFor(async () => {
            expect(isDisposed).toBe(true);
          });
        });

        it('should dispose the contextualized module on unmount and create a new on on mount', async () => {
          let isDisposed = false;

          const m = new ComponentProviderModule({
            identifier: Symbol('DISPOSE_MODULE_ON_UNMOUNT'),
            onReady: async () => {
              isDisposed = false;
            },
            onDispose: async () => {
              isDisposed = true;
            },
          }).toNaked();

          const C = provideModuleToComponent(m, () => null);

          const { unmount } = await act(async () => render(<C />));

          unmount();

          await waitFor(async () => {
            expect(isDisposed).toBe(true);
          });

          await act(async () => render(<C />));

          await waitFor(async () => {
            expect(isDisposed).toBe(false);
          });
        });
      });
    });
  });
});
