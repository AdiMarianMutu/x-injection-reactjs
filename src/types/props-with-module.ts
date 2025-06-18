import type { DependencyProvider, ModuleOrBlueprint } from '@adimm/x-injection';

export type PropsWithModule<P extends Record<string, any>> = P & {
  /**
   * The {@link ModuleOrBlueprint} which this component should consume.
   *
   * **Note:** _Can be used to easily mock an entire module._
   *
   * example:
   * ```tsx
   * const CarModuleBp = ProviderModule.blueprint({
   *   id: 'CarModule',
   *   imports: [CarEngineModule, CarDashboardModule],
   *   providers: [CarService],
   *   exports: [CarService],
   * });
   *
   * const cbMock = jest.fn();
   *
   * const CarModulBpeMocked = CarModuleBp.clone().updateDefinition({
   *   providers: [
   *     {
   *       provide: CarService, useValue: { startEngine: cbMock }
   *     },
   *   ]
   * });
   *
   * await act(async () => render(<CarComponent module={CarModuleBpMocked} />));
   *
   * await waitFor(async () => {
   *   expect(cbMock).toHaveBeenCalled();
   * });
   * ```
   */
  module?: ModuleOrBlueprint;

  /**
   * Can be used to control the dependencies consumed by this component.
   * This is useful when you want to provide an already resolved instance of a dependency down the component tree.
   *
   * eg:
   * ```tsx
   * class InputboxService {
   *   currentValue = '';
   * }
   *
   * class FormService {
   *   constructor(
   *     public readonly firstNameInputbox: InputboxService,
   *     public readonly lastNameInputbox: InputboxService
   *   ) {
   *     this.firstNameInputbox.currentValue = 'John';
   *     this.lastNameInputbox.currentValue = 'Doe';
   *   }
   * }
   *
   * const Form = provideModuleToComponent(FormModule, () => {
   *   const service = useInject(FormService);
   *
   *   return (
   *     <>
   *       <Inputbox inject={[{ provide: InputboxService, useValue: service.firstNameInputbox }]} />
   *       <Inputbox inject={[{ provide: InputboxService, useValue: service.lastNameInputbox }]} />
   *     </>
   *   );
   * });
   * ```
   */
  inject?: DependencyProvider[];
};
