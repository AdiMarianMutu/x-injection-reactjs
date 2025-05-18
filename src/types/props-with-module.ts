import type { DependencyProvider } from '@adimm/x-injection';

import type { IComponentProviderModule } from './component-provider-module';

export type PropsWithModule<P extends Record<string, any>> = P & {
  /**
   * The {@link IComponentProviderModule | Module} which this component should consume.
   *
   * **Note:** _Can be used to easily mock an entire module._
   *
   * example:
   * ```tsx
   * const CarModule = new ComponentProviderMdule({
   *   identifier: Symbol('CarModule'),
   *   imports: [CarEngineModule, CarDashboardModule],
   *   providers: [CarService],
   *   exports: [CarService],
   * });
   *
   * const cbMock = jest.fn();
   *
   * const CarModuleMocked = CarModule.clone({
   *   providers: [
   *     {
   *       provide: CarService, useValue: { startEngine: cbMock }
   *     },
   *   ]
   * });
   *
   * await act(async () => render(<CarComponent module={CarModuleMocked} />));
   *
   * await waitFor(async () => {
   *   expect(cbMock).toHaveBeenCalled();
   * });
   * ```
   */
  module?: IComponentProviderModule;

  /**
   * Can be used to control the dependencies consumed by this component.
   * This is useful when you want to provide an already resolved instance of a dependency down the component tree.
   *
   * **Note:** _It'll throw when attempting to provide the `inject` prop to a component using a module_
   * _marked as global!_
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
