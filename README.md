<h1 align="center">
xInjection ReactJS <a href="https://www.npmjs.com/package/@adimm/x-injection-reactjs" target="__blank"><img src="https://badgen.net/npm/v/@adimm/x-injection-reactjs"></a>
<img src="https://badgen.net/npm/license/@adimm/x-injection-reactjs">
<a href="https://app.codecov.io/gh/AdiMarianMutu/x-injection-reactjs" target="__blank"><img src="https://badgen.net/codecov/c/github/AdiMarianMutu/x-injection-reactjs"></a>
</h1>

<p align="center">
<a href="https://github.com/AdiMarianMutu/x-injection-reactjs/actions/workflows/ci.yml?query=branch%3Amain" target="__blank"><img src="https://github.com/AdiMarianMutu/x-injection-reactjs/actions/workflows/ci.yml/badge.svg?branch=main"></a>
<a href="https://github.com/AdiMarianMutu/x-injection-reactjs/actions/workflows/publish.yml" target="__blank"><img src="https://github.com/AdiMarianMutu/x-injection-reactjs/actions/workflows/publish.yml/badge.svg"></a>
<br>
<img src="https://badgen.net/bundlephobia/minzip/@adimm/x-injection-reactjs">
<a href="https://www.npmjs.com/package/@adimm/x-injection-reactjs" target="__blank"><img src="https://badgen.net/npm/dm/@adimm/x-injection-reactjs"></a>
</p>

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Overview](#overview)
- [Installation](#installation)
  - [TypeScript Configuration](#typescript-configuration)
- [Getting Started](#getting-started)
  - [Component ProviderModules](#component-providermodules)
  - [Component Injection](#component-injection)
    - [Via anonymous function](#via-anonymous-function)
    - [Via named function](#via-named-function)
  - [Hook Injection](#hook-injection)
- [Examples](#examples)
  - [Composable components](#composable-components)
- [Unit Tests](#unit-tests)
- [Documentation](#documentation)
- [Contributing](#contributing)

## Overview

**xInjection** is a robust Inversion of Control [(IoC)](https://en.wikipedia.org/wiki/Inversion_of_control) library that extends [InversifyJS](https://github.com/inversify/InversifyJS) with a modular, [NestJS](https://github.com/nestjs/nest)-inspired Dependency Injection [(DI)](https://en.wikipedia.org/wiki/Dependency_injection) system. It enables you to **encapsulate** dependencies with fine-grained control using **[ProviderModule](https://adimarianmutu.github.io/x-injection/classes/ProviderModule.html)** classes, allowing for clean **separation** of concerns and **scalable** architecture.

Each `ProviderModule` manages its _own_ container, supporting easy **decoupling** and _explicit_ control over which providers are **exported** and **imported** across modules. The global **[AppModule](https://adimarianmutu.github.io/x-injection/variables/AppModule.html)** is always available, ensuring a seamless foundation for your application's DI needs.

> For more details and info please access the [xInjection](https://github.com/AdiMarianMutu/x-injection) library repository.

## Installation

First, ensure you have [`reflect-metadata`](https://www.npmjs.com/package/reflect-metadata) installed:

```sh
npm i reflect-metadata
```

Then install `xInjection` for React:

```sh
npm i @adimm/x-injection-reactjs
```

> You may also have to install the parent library via `npm i @adimm/x-injection`

### TypeScript Configuration

Add the following options to your `tsconfig.json` to enable decorator metadata:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Getting Started

If you never used the parent library (`xInjection`), then please access the official [xInjection Repository](https://github.com/AdiMarianMutu/x-injection?tab=readme-ov-file#getting-started) to better understand how to use its `ReactJS` implementation.

### Component ProviderModules

A [ComponentProviderModule](https://adimarianmutu.github.io/x-injection-reactjs/interfaces/IComponentProviderModule.html) isn't so different than the original [ProviderModule](https://adimarianmutu.github.io/x-injection/interfaces/IProviderModule.html) from the base `xInjection` library, the main difference being that it'll automatically create a [clone](https://adimarianmutu.github.io/x-injection-reactjs/interfaces/IComponentProviderModule.html#clone) of itself whenever a component is `mounted` and during the `unmount` process it'll [dispose](https://adimarianmutu.github.io/x-injection-reactjs/interfaces/IComponentProviderModule.html#dispose) itself.

This is needed so:

- Each instance of a component has its own instance of the `ProviderModule` _(also known as `ContextualizedModule`)_
- Whenever a component is unmounted, the container of that `ContextualizedModule` is destroyed, making sure that the resources can be garbage-collected by the JS garbage collector.

> **Note:** By default each `ContextualizedModule` has its `InjectionScope` set to `Singleton`, you can of course change it by providing the [defaultScope](https://adimarianmutu.github.io/x-injection/interfaces/ProviderModuleOptions.html#defaultscope) property.

### Component Injection

In order to be able to inject dependencies into your components, you must first supply them with a `ComponentProviderModule`.

This is how you can create one:

```ts
@Injectable()
export class UserService {
  firstName: string;
  lastName: string;

  generateFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

export const UserComponentModule = new ComponentProviderModule({
  identifier: Symbol('UserComponentModule'),
  providers: [UserService],
});

interface UserInfoProps {
  firstName: string;
  lastName: string;
}
```

Now you have to actually provide the `UserComponentModule` to your component(s). You can do so with 2 different methods:

#### Via anonymous function

If you prefer to use the `const Component = () => {}` syntax, then you must use the [provideModuleToComponent](https://adimarianmutu.github.io/x-injection-reactjs/functions/provideModuleToComponent.html) method as shown below:

> **Note:** _This is the preferred method as it allows you to avoid wrapping your component within another provider once created._

```tsx
// The UserInfo component will correctly infer the interface of `UserInfoProps` automatically!
export const UserInfo = provideModuleToComponent<UserInfoProps>(UserComponentModule, ({ firstName, lastName }) => {
  const userService = useInject(UserService);

  userService.firstName = firstName;
  userService.lastName = lastName;

  return <p>Hello {userService.generateFullName()}!</p>;
});

function MyApp() {
  return <UserInfo firstName="John" lastName="Doe" />;
  // Result
  //
  // <p>Hello John Doe!</p>
}
```

#### Via named function

Or if you prefer to use the `function Component() {}` syntax, then you must use the [ProvideModule](https://adimarianmutu.github.io/x-injection-reactjs/functions/ProvideModule.html) `HoC` as shown below:

> **Note:** _If you need to access the contextualized `module` forwarded to your component, you can wrap the component props with the [PropsWithModule](https://adimarianmutu.github.io/x-injection-reactjs/types/PropsWithModule.html) generic type._

```tsx
export function UserInfo({ firstName, lastName }: UserInfoProps) {
  const userService = useInject(UserService);

  userService.firstName = firstName;
  userService.lastName = lastName;

  return <p>Hello {userService.generateFullName()}!</p>;
}

function MyApp() {
  return (
    <ProvideModule module={UserComponentModule}>
      <UserInfo firstName="John" lastName="Doe" />
    </ProvideModule>
  );
  // Result
  //
  // <p>Hello John Doe!</p>
}
```

That's all you need to do, at least for simple components 😃.

> You can find more complex examples at the [Examples](#examples) section.

### Hook Injection

You already have seen in action the low-level [useInject](https://adimarianmutu.github.io/x-injection-reactjs/functions/useInject.html) hook _(take a look also at the [useInjectMany](https://adimarianmutu.github.io/x-injection-reactjs/functions/useInjectMany.html) hook)_. It is quite useful when you just have to inject quickly some dependencies into a component quite simple.

What it does under the hood? Finds the nearest contextualized module and resolves from it the required dependencies into your component, that's all.

But, as your UI will grow, you'll soon discover that you may inject more dependencies into a component, or even in multiple components, therefore you'll end up writing a lot of duplicated code, well, as per the [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself#:~:text=%22Don't%20repeat%20yourself%22,redundancy%20in%20the%20first%20place.) principle, that's not good! 🥲

This means that we can actually use the [hookFactory](https://adimarianmutu.github.io/x-injection-reactjs/functions/hookFactory.html) method to compose a _custom_ hook with access to any dependency available in the component contextualized module.

Having the above examples with the `UserService`, we'll create a custom `generateFullName` hook.

```ts
// The `HookWithDeps` generic type will help
// in making sure that the `useGenerateUserFullName` hooks params are correctly visible.
// The 1st generic param must be the hook params (Like `UserInfoProps`)
// and starting from the 2nd generic param you must provide the type of your dependencies.
const useGenerateUserFullName = hookFactory({
  // The `use` property is where you write your hook implementation.
  use: ({ firstName, lastName, deps: [userService] }: HookWithDeps<UserInfoProps, [UserService]>) => {
    userService.firstName = firstName;
    userService.lastName = lastName;

    return userService.generateFullName();
  },
  // The `inject` array is very important,
  // here we basically specify which dependencies should be injected into the custom hook.
  // Also, keep in mind that the order of the `inject` array matters, the order of the `deps` prop
  // is determined by the order of the `inject` array!
  inject: [UserService],
});
```

Now you can use it in inside any component which has access to a contextualized module which can provide the `UserService`.

```tsx
export function UserInfo({ firstName, lastName }: UserInfoProps) {
  const userFullName = useGenerateFullName({ firstName, lastName });

  return <p>Hello {userFullName}!</p>;
}
```

> **Note:** _If your custom hook does not accept any parameter, you can provide `void` to the 1st generic type._
>
> e.g: `use: ({ deps: [userService] }: HookWithDeps<void, [UserService]>)`

## Examples

### Composable components

In a real world scenario, you'll definitely have custom components which render other custom components and so on... _(like a [Matryoshka doll](https://en.wikipedia.org/wiki/Matryoshka_doll))_

So you may find yourself wanting to be able to control a dependency/service of a child component from a parent component, with `xInjection` this is very easy to achieve thanks to the `ProviderModule` architecture, because each `module` can `import` and `export` other dependencies _(or modules)_ it fits in perfectly within the [declarative programming](https://en.wikipedia.org/wiki/Declarative_programming) world!

In this example, we'll build 4 components, each with its own purpose. However, the `autocomplete` component will be the one capable of accessing the services of all of them.

- An `inputbox`
- A `list viewer`
- A `dropdown`
- An `autocomplete`

<hr>

> Inputbox

`inputbox.service.ts`

```ts
@Injectable()
export class InputboxService {
  currentValue = '';

  // We'll initialize this soon enough.
  setStateValue!: (newValue: string) => void;

  /** Can be used to update the {@link currentValue} of the `inputbox`. */
  setValue(newValue: string): void {
    this.currentValue = newValue;

    this.setStateValue(this.currentValue);
  }
}

export const InputboxModule = new ComponentProviderModule({
  identifier: Symbol('InputboxModule'),
  provides: [InputboxService],
  exports: [InputboxService],
});
```

`inputbox.tsx`

```tsx
export interface InputboxProps {
  initialValue: string;
}

export const Inputbox = provideModuleToComponent<InputboxProps>(InputboxModule, ({ initialValue }) => {
  const service = useInject(InputboxService);
  const [, setCurrentValue] = useState(initialValue);
  service.setStateValue = setCurrentValue;

  useEffect(() => {
    service.currentValue = initialValue;
  }, [initialValue]);

  return <input value={service.currentValue} onChange={(e) => service.setValue(e.currentTarget.value)} />;
});
```

<hr>

> Listview

`listview.service.ts`

```ts
@Injectable()
export class ListviewService {
  items = [];

  /* Remaining fancy implementation */
}

export const ListviewModule = new ComponentProviderModule({
  identifier: Symbol('ListviewModule'),
  provides: [ListviewService],
  exports: [ListviewService],
});
```

`listview.tsx`

```tsx
export interface ListviewProps {
  items: any[];
}

export const Listview = provideModuleToComponent<ListviewProps>(ListviewModule, ({ items }) => {
  const service = useInject(ListviewService);

  /* Remaining fancy implementation */

  return (
    <div>
      {service.items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
});
```

<hr>

> Dropdown

Now keep close attention to how we implement the `Dropdown` component, as it'll actually be the _parent_ controlling the `Listview` component own service.

`dropdown.service.ts`

```ts
@Injectable()
export class DropdownService {
  constructor(readonly listviewService: ListviewService) {
    // We can already take control of the children `ListviewService`!
    this.listviewService.items = [1, 2, 3, 4, 5];
  }

  /* Remaining fancy implementation */
}

export const DropdownModule = new ComponentProviderModule({
  identifier: Symbol('DropdownModule'),
  // It is very important that we import all the exportable dependencies from the `ListviewModule`!
  imports: [ListviewModule],
  provides: [DropdownService],
  exports: [
    // Let's also re-export the dependencies of the `ListviewModule` so once we import the `DropdownModule`
    // somewhere elese, we get access to the `ListviewModule` exported dependencies as well!
    ListviewModule,
    // Let's not forget to also export our `DropdownService` :)
    DropdownService,
  ],
});
```

`dropdown.tsx`

```tsx
export interface DropdownProps {
  listviewProps: ListviewProps;

  initialSelectedValue: number;
}

export const Dropdown = provideModuleToComponent<DropdownProps>(
  ListviewModule,
  ({ listviewProps, initialSelectedValue }) => {
    const service = useInject(DropdownService);

    /* Remaining fancy implementation */

    return (
      <div className="fancy-dropdown">
        <span>{initialSelectedValue}</span>

        {/* Here we tell the `ListView` component to actually use the `ListviewService` instance we provide via the `useValue` property. */}
        {/* Each `useInject(ListviewService)` used inside the `ListView` component will automatically resolve to `service.listviewService`. */}
        <Listview {...listviewProps} inject={[{ provide: ListviewService, useValue: service.listviewService }]} />
      </div>
    );
  }
);
```

<hr>

> Autocomplete

And finally the grand finale!

`autocomplete.service.ts`

```ts
@Injectable()
export class AutocompleteService {
  constructor(
    readonly inputboxService: InputboxService,
    readonly dropdownService: DropdownService
  ) {
    // Here we can override even what the `Dropdown` has already overriden!
    this.dropdownService.listviewService.items = [29, 9, 1969];

    // However doing the following, will throw an error because the `Inputbox` component
    // at this time is not yet mounted, therefore the `setStateValue` state setter
    // method doesn't exist yet.
    //
    // A better way would be to use a store manager so you can generate your application state through
    // the services, rather than inside the UI (components should be used only to render the data, not to manipulate/manage it).
    this.inputboxService.setValue('xInjection');
  }

  /* Remaining fancy implementation */
}

export const AutocompleteModule = new ComponentProviderModule({
  identifier: Symbol('AutocompleteModule'),
  imports: [InputboxModule, DropdownModule],
  provides: [AutocompleteService],
  // If we don't plan to share the internal dependencies of the
  // Autocomplete component, then we can omit the `exports` array declaration.
});
```

`autocomplete.tsx`

```tsx
export interface AutocompleteProps {
  inputboxProps: InputboxProps;
  dropdownProps: DropdownProps;

  currentText: string;
}

export const Autocomplete = provideModuleToComponent<AutocompleteProps>(AutocompleteModule, ({ inputboxProps, dropdownProps, currentText }) => {
    const service = useInject(AutocompleteService);

    service.inputboxService.currentValue = currentText;

    console.log(service.dropdownService.listviewService.items);
    // Produces: [29, 9, 1969]

    /* Remaining fancy implementation */

    return (
      <div className="fancy-autocomplete">
        {/* Let's not forget to replace the injection providers of both components we want to control */}
        <Inputbox {...inputboxProps} inject={[{ provide: InputboxService, useValue: service.inputboxService }]} >
        <Dropdown {...dropdownProps} inject={[{ provide: DropdownService, useValue: service.dropdownService }]} />
      </div>
    );
  }
);
```

This should cover the fundamentals of how you can build a scalable UI by using the `xInjection` Dependency Injection 😊

> **Note:** _Keep in mind that both library ([xInjection](https://www.npmjs.com/package/@adimm/x-injection) & [xInjection ReactJS](https://www.npmjs.com/package/@adimm/x-injection-reactjs)) are still young and being developed, therefore the internals and public API may change in the near future._

## Unit Tests

It is very easy to create mock modules so you can provide them to your components in your unit tests.

```tsx
class ApiService {
  constructor(private readonly userService: UserService) {}

  async sendRequest<T>(location: LocationParams): Promise<T> {
    // Pseudo Implementation
    return this.sendToLocation(user, location);
  }

  private async sendToLocation(user: User, location: any): Promise<any> {}
}

const ApiModule = new ComponentProviderModule({
  identifier: Symbol('ApiModule'),
  providers: [UserService, ApiService],
});

const ApiModuleMocked = new ComponentProviderModule({
  identifier: Symbol('ApiModule_MOCK'),
  providers: [
    {
      provide: UserService,
      useClass: UserService_Mock,
    },
    {
      provide: ApiService,
      useValue: {
        sendRequest: async (location) => {
          console.log(location);
        },
      },
    },
  ],
});

// Now all the dependencies used inside the `RealComponent` will be automatically resolved from the `ApiModuleMocked` component module.
await act(async () => render(<RealComponent module={ApiModuleMocked} />));
```

## Documentation

Comprehensive, auto-generated documentation is available at:

👉 [https://adimarianmutu.github.io/x-injection-reactjs/index.html](https://adimarianmutu.github.io/x-injection-reactjs/index.html)

## Contributing

Pull requests are warmly welcomed! 😃

Please ensure your contributions adhere to the project's code style. See the repository for more details.

---

> For questions, feature requests, or bug reports, feel free to open an [issue](https://github.com/AdiMarianMutu/x-injection-reactjs/issues) on GitHub!
