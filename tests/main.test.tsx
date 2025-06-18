import '@testing-library/jest-dom';

import { Injectable, InjectionProviderModuleError, InjectionScope, ProviderModule } from '@adimm/x-injection';
import { render as _render, act, fireEvent, screen, waitFor } from '@testing-library/react';
import React, { useState } from 'react';

import { hookFactory, HookWithDeps, provideModuleToComponent, useInject, useInjectMany } from '../src';
import { InjectionHookFactoryError } from '../src/errors';
import { GlobalModuleBp, GlobalService, RandomModuleBp, RandomService, UserModuleBp, UserService } from './setup';

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

  const user = {
    firstName: 'Maria',
    lastName: 'Rotaru',
  };

  describe('ProvideModule', () => {
    afterEach(() => jest.clearAllMocks());
    const TEST_ID = 'provide-module';

    it('should work when using the `provideModuleToComponent` HoC method', async () => {
      const C = provideModuleToComponent(UserModuleBp, ({ firstName, lastName }: typeof user) => {
        const service = useInject(UserService);
        return <h1 data-testid={TEST_ID}>Hello {service.generateFullName(firstName, lastName)}</h1>;
      });

      await act(async () => render(<C firstName={user.firstName} lastName={user.lastName} />));

      await waitFor(async () => {
        expect(await screen.findByTestId(TEST_ID)).toHaveTextContent(`Hello ${user.firstName} ${user.lastName}`);
      });
    });
  });

  describe('Performance', () => {
    it('should not cause an immediate re-render', async () => {
      let cnt = 0;
      const MyComponent = provideModuleToComponent(UserModuleBp, () => {
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
        provideModuleToComponent(UserModuleBp, () => {
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

  describe('Injection Scope', () => {
    describe('Singleton', () => {
      it('should be the same instance between re-renders', async () => {
        const randomValues: number[] = [];
        const C = provideModuleToComponent(RandomModuleBp, () => {
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
      const mbp0 = ProviderModule.blueprint({
        id: 'mb0',
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
        const C = provideModuleToComponent(mbp0, () => {
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
      const mbp0 = ProviderModule.blueprint({
        id: 'mbp0',
        defaultScope: InjectionScope.Request,
        providers: [Service, RandomService],
      });

      it('should NOT be the same instance between re-renders but constructor dependencies should be of the same instance', async () => {
        const mainRandomValues: number[] = [];
        const randomValues = {
          from1stService: undefined as unknown as number,
          from2ndService: undefined as unknown as number,
        };
        const C = provideModuleToComponent(mbp0, () => {
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

    const BaseModuleBp0 = ProviderModule.blueprint({
      id: 'BaseModuleBp0',
      providers: [BaseService],
      exports: [BaseService],
    });
    const InnerModuleBp = ProviderModule.blueprint({
      id: 'InnerModuleBp',
      providers: [InnerService],
      imports: [BaseModuleBp0, RandomModuleBp, UserModuleBp],
    });

    it('should inject multiple dependencies at once when using `useInjectMany`', async () => {
      const C = provideModuleToComponent(InnerModuleBp, () => {
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

        const C = provideModuleToComponent(InnerModuleBp, () => {
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
        const C = provideModuleToComponent(InnerModuleBp, ({ firstName, lastName }: typeof user) => {
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
        const C = provideModuleToComponent(InnerModuleBp, ({ firstName, lastName }: typeof user) => {
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
          expect(await screen.findByTestId('greetings')).toHaveTextContent(`Hello ${user.firstName} ${user.lastName}`);
        });
      });

      it('should successfully compose a custom hook with automatic access to the `ProvideModule.inject` prop', async () => {
        @Injectable()
        class TestService {
          value = '';
        }
        const useTestHook = hookFactory({
          use: ({ deps: [testService] }: HookWithDeps<void, [TestService]>) => {
            return testService.value;
          },
          inject: [TestService],
        });
        const C = provideModuleToComponent(
          ProviderModule.blueprint({
            id: 'mbp0',
            providers: [TestService],
          }),
          () => {
            const value = useTestHook();
            return <span data-testid="test">{value}</span>;
          }
        );

        await act(async () => render(<C inject={[{ provide: TestService, useValue: { value: 'Hello World!' } }]} />));

        await waitFor(async () => {
          expect(await screen.findByTestId('test')).toHaveTextContent('Hello World!');
        });
      });
    });
  });

  describe('Parent inheritance', () => {
    it('Form -> Inputbox & Inputbox', async () => {
      @Injectable()
      class InputboxService {
        currentValue = '';
      }

      @Injectable()
      class FormService {
        constructor(
          public readonly firstNameInputbox: InputboxService,
          public readonly lastNameInputbox: InputboxService
        ) {
          this.firstNameInputbox.currentValue = 'A';
          this.lastNameInputbox.currentValue = 'B';
        }
      }

      const InputboxModuleBp = ProviderModule.blueprint({
        id: 'InputboxModuleBp',
        defaultScope: InjectionScope.Transient,
        providers: [InputboxService],
        exports: [InputboxService],
      });

      const FormModuleBp = ProviderModule.blueprint({
        id: 'FormModuleBp',
        imports: [InputboxModuleBp],
        providers: [FormService],
      });

      const Inputbox = provideModuleToComponent<{ testId: string }>(InputboxModuleBp, ({ testId }) => {
        const service = useInject(InputboxService);
        return <span data-testid={testId}>{service.currentValue}</span>;
      });

      const Form = provideModuleToComponent(FormModuleBp, () => {
        const service = useInject(FormService);
        return (
          <>
            <Inputbox
              inject={[{ provide: InputboxService, useValue: service.firstNameInputbox }]}
              testId="first-name"
            />
            <Inputbox inject={[{ provide: InputboxService, useValue: service.lastNameInputbox }]} testId="last-name" />
          </>
        );
      });

      await act(async () => render(<Form />));

      await waitFor(async () => {
        expect(await screen.findByTestId('first-name')).toHaveTextContent('A');
        expect(await screen.findByTestId('last-name')).toHaveTextContent('B');
      });
    });

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
      const ListViewModuleBp = ProviderModule.blueprint({
        id: 'ListViewModuleBp',
        providers: [ListViewService],
        exports: [ListViewService],
      });

      const ListViewComponent = provideModuleToComponent(ListViewModuleBp, () => {
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

      const DropdownModuleBp = ProviderModule.blueprint({
        id: 'DropdownModuleBp',
        imports: [ListViewModuleBp],
        providers: [DropdownService],
        exports: [ListViewModuleBp, DropdownService],
      });

      const DropdownComponent = provideModuleToComponent(DropdownModuleBp, () => {
        const service = useInject(DropdownService);
        return (
          <div data-test="dropdown">
            <ListViewComponent inject={[{ provide: ListViewService, useValue: service.listViewService }]} />
          </div>
        );
      });

      //#endregion

      //#region Inputbox Component
      @Injectable()
      class InputboxService {
        value = '';
      }
      const InputboxModuleBp = ProviderModule.blueprint({
        id: 'InputboxModuleBp',
        providers: [InputboxService],
        exports: [InputboxService],
      });

      const InputboxComponent = provideModuleToComponent(InputboxModuleBp, () => {
        const service = useInject(InputboxService);
        return (
          <input
            data-testid="inputbox"
            value={service.value}
            onChange={(e) => {
              service.value = e.currentTarget.value;
            }}
          />
        );
      });
      //#endregion

      //#region AutoComplete Component
      @Injectable()
      class AutoCompleteService {
        constructor(
          readonly inputboxService: InputboxService,
          readonly dropdownService: DropdownService
        ) {
          this.inputboxService.value = dropdownDefaultValue;
          this.dropdownService.listViewService.numberOfItems = dropdownNumberOfItems;
        }
      }

      const AutoCompleteModuleBp = ProviderModule.blueprint({
        id: 'AutoCompleteModuleBp',
        imports: [InputboxModuleBp, DropdownModuleBp],
        providers: [AutoCompleteService],
        exports: [AutoCompleteService],
      });

      const AutoCompleteComponent = provideModuleToComponent<{
        testId: string;
        serCb?: (ser: AutoCompleteService) => void;
      }>(AutoCompleteModuleBp, ({ testId, serCb }) => {
        const service = useInject(AutoCompleteService);
        serCb?.(service);
        return (
          <div data-testid={testId}>
            <InputboxComponent inject={[{ provide: InputboxService, useValue: service.inputboxService }]} />
            <DropdownComponent inject={[{ provide: DropdownService, useValue: service.dropdownService }]} />
          </div>
        );
      });
      //#endregion

      const { rerender } = await act(async () =>
        render(<AutoCompleteComponent testId="a" serCb={(x) => (autocompleteServiceA = x)} />)
      );

      await waitFor(async () => {
        expect((await screen.findByTestId('inputbox')).getAttribute('value')).toBe(dropdownDefaultValue);
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
    it('should dispose the internal component module on unmount and create a new on on mount', async () => {
      const readyCb = jest.fn();
      const disposeCb = jest.fn();

      const mbp0 = ProviderModule.blueprint({
        id: 'mbp0',
        onReady: readyCb,
        onDispose: () => {
          return {
            after: disposeCb,
          };
        },
      });

      const C = provideModuleToComponent(mbp0, () => null);

      const { unmount } = await act(async () => render(<C />));

      unmount();

      await waitFor(async () => {
        expect(disposeCb).toHaveBeenCalledTimes(1);
      });

      await act(async () => render(<C />));

      await waitFor(async () => {
        expect(readyCb).toHaveBeenCalledTimes(USE_REACT_STRICT_MODE ? 4 : 2);
      });
    });
  });

  describe('Misc', () => {
    afterEach(() => jest.clearAllMocks());

    it('should be able to use the `AppModule` even when a component is not wrapped with a `ProvideModule` strategy', async () => {
      let serviceFromComponent: GlobalService;

      const C = () => {
        serviceFromComponent = useInject(GlobalService);

        return null;
      };

      await act(async () => render(<C />));

      await waitFor(async () => {
        expect(serviceFromComponent).toBe(ProviderModule.create({ id: 'm0' }).get(GlobalService));
      });
    });

    it('should throw when providing a `global` module', async () => {
      const C = provideModuleToComponent(GlobalModuleBp, () => null);

      expect(() => render(<C />)).toThrow(InjectionProviderModuleError);
    });
  });
});
