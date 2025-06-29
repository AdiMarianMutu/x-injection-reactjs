<p align="center">
<img width="260px" height="auto" alt="xInjection Logo" src="https://raw.githubusercontent.com/AdiMarianMutu/x-injection/main/assets/logo.png"><br /><a href="https://www.npmjs.com/package/@adimm/x-injection-reactjs" target="__blank"><img src="https://badgen.net/npm/v/@adimm/x-injection-reactjs"></a>
<a href="https://app.codecov.io/gh/AdiMarianMutu/x-injection-reactjs" target="__blank"><img src="https://badgen.net/codecov/c/github/AdiMarianMutu/x-injection-reactjs"></a>
<img src="https://badgen.net/npm/license/@adimm/x-injection-reactjs">
</p>

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
  - [Quick Start](#quick-start)
  - [Conventions](#conventions)
  - [Component Module](#component-module)
  - [Component Service](#component-service)
  - [How to tie a `ProviderModule` to a `Component`?](#how-to-tie-a-providermodule-to-a-component)
    - [Is your component re-usable?](#is-your-component-re-usable)
      - [Yes](#yes)
      - [No](#no)
  - [How to control a Child component providers from Parent component?](#how-to-control-a-child-component-providers-from-parent-component)
    - [Override the entire Child Module](#override-the-entire-child-module)
    - [Override only specific Child Providers](#override-only-specific-child-providers)
  - [Hook Injection](#hook-injection)
- [Examples](#examples)
  - [Composable components](#composable-components)
- [Unit Tests](#unit-tests)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Credits](#credits)

## Overview

This is the _official_ [ReactJS](https://react.dev/) implementation of the [xInjection](https://github.com/AdiMarianMutu/x-injection) library.

> [!Warning]
>
> The usage of the `base` library will not be explained here, I'll assume you already know how to use the `xInjection` library, if that's not the case, please refer to the `xInjection` [Gettng Started](https://github.com/AdiMarianMutu/x-injection?tab=readme-ov-file#getting-started) section.

## Installation

First, ensure you have [`reflect-metadata`](https://www.npmjs.com/package/reflect-metadata) installed:

```sh
npm i reflect-metadata
```

Then install `xInjection` for React:

```sh
npm i @adimm/x-injection-reactjs
```

> [!Note]
>
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

### Quick Start

```tsx
const UserDashboardModuleBp = ProviderModule.blueprint({
  id: 'ComponentUserDashboardModule',
  imports: [UserModule],
  exports: [UserModule],
});

const UserDashboard = provideModuleToComponent(UserDashboardModuleBp, () => {
  const userService = useInject(UserService);

  return (
    <h1>
      Hello {userService.firstName} {userService.lastName}!
    </h1>
  );
});

const App = () => {
  return (
    <>
      <Navbar />
      <UserDashboard />
      <Footer />
    </>
  );
};
```

### Conventions

Before continuing you should read also the [Conventions](https://github.com/AdiMarianMutu/x-injection?tab=readme-ov-file#conventions) section of the _parent_ library.

### Component Module

You should create a separate file which you'll use to declare the `blueprint` of the _component_ `module`:

`user-dashboard/user-dashboard.module.ts`

```ts
export const UserDashboardModuleBp = ProviderModule.blueprint({
  id: 'ComponentUserDashboardModule',
  ...
});
```

> [!Note]
>
> You should also prefix the `id` of the `blueprints` with `Component` as this will help you to debug your app much more easier when something goes wrong.

### Component Service

You should create a separate file which you'll use to declare the _(main)_ `service` of the _component_.

`user-dashboard/user-dashboard.service.ts`

```ts
@Injectable()
export class UserDashboardService {
  firstName: string;
  lastName: string;
}
```

### How to tie a `ProviderModule` to a `Component`?

You first have to either create a `module` or `blueprint`, most of the times you'll use the `blueprint` option, if you are asking yourself how you should decide:

#### Is your component re-usable?

> Will you have **more** than **one** instance of that component?

##### Yes

- Then you have to use a `blueprint`, the reason can be understood by reading [this](https://github.com/AdiMarianMutu/x-injection?tab=readme-ov-file#import-behavior).

##### No

- Then you have to use a raw `module`, the reason is the opposite of the `blueprint` motive.

> [!Tip] If the above explaination is clear, please skip to the next section, otherwise keep reading.

Imagine that we have a `Button` component, clearly we'll have more than one instance of that component, this means that **each** _instance_ of the `Button` component must have its own `module`, where all the `singletons` will act as singletons _only inside_ the component **instance**.

> Therefore we leverage the `blueprint` _import_ behavior to achieve that naturally without additional overhead.

---

After you created the `component module`, you can provide it to the actual component by using the [provideModuleToComponent](https://adimarianmutu.github.io/x-injection-reactjs/functions/provideModuleToComponent.html) _([HoC](https://legacy.reactjs.org/docs/higher-order-components.html))_ `method`.

```tsx
const UserDashboard = provideModuleToComponent(UserDashboardModuleBp, (props: UserDashboardProps) => {
  ...
});
```

### How to control a Child component providers from Parent component?

If you need this design pattern, it is very easy to implement with `xInjection`, you actually have 2 options:

#### Override the entire Child Module

Let's say that the `Child` component has this `module`:

```ts
const ChildModuleBp = ProviderModule.blueprint({
  id: 'ComponentChildModule',
  providers: [ChildService],
  exports: [ChildService],
});
```

What you can now do is to provide the `ChildService` from the `Parent` component, like this:

```ts
const ParentModuleBp = ProviderModule.blueprint({
  id: 'ComponentParentModule',
  providers: [ParentService, ChildService],
  exports: [ParentService, ChildService],
});
```

Then, when you are rendering the `Child` component from **within** the `Parent` component:

```ts
const ParentComponent = provideModuleToComponent(ParentModuleBp, ({ module }) => {
  // the `module` prop is always available and automatically injected into the `props` object.

  return <ChildComponent module={module} />;
});
```

Now the `ChildComponent` will be instantiated with the `module` received from the `ParentComponent`, therefore it'll use the `ChildService` managed into the `ParentModule`.

> [!Tip]
>
> This is perfect to use when you are writing _unit tests_ and you want to mock an entire component `module`

#### Override only specific Child Providers

> This is the approach which you should strive to use most of the times as it is less prone to _"human error"_ than overriding the entire module.

Let's re-use the same example as the one from the above, the `ParentModule`:

```ts
const ParentModuleBp = ProviderModule.blueprint({
  id: 'ComponentParentModule',
  providers: [ParentService, ChildService],
  exports: [ParentService, ChildService],
});
```

And now the rendering part:

```ts
const ParentComponent = provideModuleToComponent(ParentModuleBp, () => {
  // notice that we are not using the `module` prop anymore.
  const childService = useInject(ChildService);

  return <ChildComponent inject={[{ provide: ChildService, useValue: childService }]} />;
});
```

By using the `inject` prop _(which as the `module` prop is always available)_ you'll _"swap"_ the `ChildService` provider with a [ProviderValueToken](https://adimarianmutu.github.io/x-injection/types/ProviderValueToken.html) which provides the `ChildService` **instance** instantiated by the `ParentComponent`.

> [!Note]
>
> If you are asking yourself `Why would I want to do that?`, that's a valid question, and most of the times you'll **not** need this feature, but sometimes, when you _compose_ components, being able to control the _providers_ of the children components becomes very useful. Check the [Composable Components](#composable-components) example to understand.

### Hook Injection

You already have seen in action the low-level [useInject](https://adimarianmutu.github.io/x-injection-reactjs/functions/useInject.html) hook _(take a look also at the [useInjectMany](https://adimarianmutu.github.io/x-injection-reactjs/functions/useInjectMany.html) hook)_. It is quite useful when you just have to inject quickly some dependencies into a component quite simple.

But, as your UI will _grow_, you'll soon discover that you may inject _more_ dependencies into a component, or even in multiple components, therefore you'll end up writing a lot of duplicated code, well, as per the [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself#:~:text=%22Don't%20repeat%20yourself%22,redundancy%20in%20the%20first%20place.) principle, we want to _avoid_ that.

This means that we can actually use the [hookFactory](https://adimarianmutu.github.io/x-injection-reactjs/functions/hookFactory.html) method to compose a _custom_ hook with access to any dependency available in the component module.

```ts
// The `HookWithDeps` generic type will help
// in making sure that the `useGenerateUserFullName` hooks params are correctly visible.
// The 1st generic param must be the hook params (Like `UserInfoProps`)
// and the 2nd generic param must be an `array` with the providers type.
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

Now you can use it in inside any component which is using a `module` which can provide the `UserService`.

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

export const InputboxModuleBp = ProviderModule.blueprint({
  id: 'ComponentInputboxModule',
  provides: [InputboxService],
  exports: [InputboxService],
});
```

`inputbox.tsx`

```tsx
export interface InputboxProps {
  initialValue: string;
}

export const Inputbox = provideModuleToComponent<InputboxProps>(InputboxModuleBp, ({ initialValue }) => {
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

export const ListviewModuleBp = ProviderModule.blueprint({
  id: 'ComponentListviewModule',
  provides: [ListviewService],
  exports: [ListviewService],
});
```

`listview.tsx`

```tsx
export interface ListviewProps {
  items: any[];
}

export const Listview = provideModuleToComponent<ListviewProps>(ListviewModuleBp, ({ items }) => {
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

export const DropdownModuleBp = ProviderModule.blueprint({
  id: 'ComponentDropdownModule',
  // It is very important that we import all the exportable dependencies from the `ListviewModule`!
  imports: [ListviewModuleBp],
  provides: [DropdownService],
  exports: [
    // Let's also re-export the dependencies of the `ListviewModule` so once we import the `DropdownModule`
    // somewhere elese, we get access to the `ListviewModule` exported dependencies as well!
    ListviewModuleBp,
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
  ListviewModuleBp,
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

export const AutocompleteModuleBp = ProviderModule.blueprint({
  id: 'ComponentAutocompleteModule',
  imports: [InputboxModuleBp, DropdownModuleBp],
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

export const Autocomplete = provideModuleToComponent<AutocompleteProps>(AutocompleteModuleBp, ({ inputboxProps, dropdownProps, currentText }) => {
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

const ApiModuleBp = new ProviderModule.blueprint({
  id: 'ApiModule',
  providers: [UserService, ApiService],
});

// Clone returns a `deep` clone and wraps all the `methods` to break their reference!
const ApiModuleBpMocked = ApiModuleBp.clone().updateDefinition({
  id: 'ApiModuleMocked',
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

// Now all the dependencies used inside the "RealComponent" will be automatically resolved from the `ApiModuleBpMocked` module.
await act(async () => render(<RealComponent module={ApiModuleBpMocked} />));
```

## Documentation

Comprehensive, auto-generated documentation is available at:

👉 [https://adimarianmutu.github.io/x-injection-reactjs/index.html](https://adimarianmutu.github.io/x-injection-reactjs/index.html)

## Contributing

Pull requests are warmly welcomed! 😃

Please ensure your contributions adhere to the project's code style. See the repository for more details.

## Credits

- [Adi-Marian Mutu](https://www.linkedin.com/in/mutu-adi-marian/) - Author of `xInjection` & `xInjection ReactJS`

---

> [!NOTE]
>
> **For questions, feature requests, or bug reports, feel free to open an [issue](https://github.com/AdiMarianMutu/x-injection-react/issues) on GitHub.**
