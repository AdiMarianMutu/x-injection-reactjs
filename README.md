<h1 align="center">
xInjection ReactJS&nbsp;<a href="https://www.npmjs.com/package/@adimm/x-injection-reactjs" target="__blank" alt="Release Version"><img src="https://img.shields.io/npm/v/@adimm/x-injection-reactjs?color=0476bc&label="></a>
<img src="https://flat.badgen.net/npm/license/@adimm/x-injection-reactjs" alt="License">
</h1>

<p align="center">
<a href="https://github.com/AdiMarianMutu/x-injection-reactjs/actions/workflows/ci.yml?query=branch%3Amain" target="__blank"><img src="https://github.com/AdiMarianMutu/x-injection-reactjs/actions/workflows/ci.yml/badge.svg?branch=main"></a>
<a href="https://github.com/AdiMarianMutu/x-injection-reactjs/actions/workflows/publish.yml" target="__blank"><img src="https://github.com/AdiMarianMutu/x-injection-reactjs/actions/workflows/publish.yml/badge.svg"></a>
<br>
<img src="https://flat.badgen.net/bundlephobia/minzip/@adimm/x-injection-reactjs">
<a href="https://www.npmjs.com/package/@adimm/x-injection-reactjs" target="__blank" alt="Monthly Downloads"><img src="https://flat.badgen.net/npm/dm/@adimm/x-injection-reactjs"></a>
</p>

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Overview](#overview)
- [Installation](#installation)
  - [TypeScript Configuration](#typescript-configuration)
- [Getting Started](#getting-started)
- [Examples](#examples)
  - [Component with private context](#component-with-private-context)
  - [Component with public context](#component-with-public-context)
    - [Safe method](#safe-method)
    - [Experimental method](#experimental-method)
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

If you never used the parent library (`xInjection`), then please access the official [xInjection Repository](https://github.com/AdiMarianMutu/x-injection?tab=readme-ov-file#registering-global-providers) to better understand how to use its `ReactJS` implementation.

## Examples

### Component with private context

A component with a private context it means that when it'll inject dependencies from a module within its instance,
a parent component will not be able to access those dependencies instances.

```tsx
export class RandomNumberService {
  generate(): number {
    /* ... */
  }
}

// Make sure to use the `ComponentProviderModule` from `@adimm/x-injection-reactjs` not the `ProviderModule` from `@adimm/x-injection`!
export const RandomNumberComponentModule = new ComponentProviderModule({
  identifier: Symbol('RandomNumberComponentModule'),
  providers: [RandomNumberService],
});

export function RandomNumberComponent(props: RandomNumberComponentProps) {
  const service = useInject(RandomNumberService);

  return <h1>A random number: {service.generate()}</h1>;
}
```

### Component with public context

#### Safe method

```tsx
export class RandomNumberService {
  generate(): number {
    /* ... */
  }
}

// Make sure to use the `ComponentProviderModule` from `@adimm/x-injection-reactjs` not the `ProviderModule` from `@adimm/x-injection`!
export const RandomNumberComponentModule = new ComponentProviderModule({
  identifier: Symbol('RandomNumberComponentModule'),
  providers: [RandomNumberService],
  exports: [RandomNumberService],
});

export function RandomNumberComponent(props: RandomNumberComponentProps) {
  // This hook is necessary in order to expose the component instance
  // context up to the parent component
  useExposeComponentModuleContext();

  const service = useInject(RandomNumberService);

  return <h1>A random number: {service.generate()}</h1>;
}

////////////////////////////////////////

export class ParentService {
  constructor(public readonly randomNumberService: RandomNumberService) {}

  injectRandomNumberService(service: RandomNumberService): void {
    this.randomNumberService = service;
  }
}

export const ParentServiceComponentModule = new ComponentProviderModule({
  identifier: Symbol('ParentServiceComponentModule'),
  imports: [RandomNumberComponentModule],
  providers: [ParentService],
});

export function ParentComponent(props: ParentComponentProps) {
  const service = useInject(ParentService);

  return (
    <>
      <TapIntoComponent
        // By using the fluid syntax
        contextInstance={() => ({
          // If one of the children did expose the `RandomNumberComponentModule`
          // module, we'll be able to access its instance.
          tryGet: RandomNumberComponentModule,
          thenDo: (ctx) => {
            const randomNumberService_FromComponentInstance = ctx.get(RandomNumberComponentModule);

            service.injectRandomNumberService(randomNumberService_FromComponentInstance);
          },
        })}>
        <RandomNumberComponent />
      </TapIntoComponent>

      <TapIntoComponent
        // By accessing the entire underlying context map which may contain even more
        // modules exposed by more children down the tree.
        contextInstance={(ctxMap) => {
          const ctx = ctxMap.get(RandomNumberComponentModule.toString());
          if (!ctx) return;

          const randomNumberService_FromComponentInstance = ctx.get(RandomNumberComponentModule);

          service.injectRandomNumberService(randomNumberService_FromComponentInstance);
        }}>
        <RandomNumberComponent />
      </TapIntoComponent>
    </>
  );
}
```

#### Experimental method

There is another method which is currently in _experimental_ mode and it may not always work as expected, it may even produce unnecessary re-render cycles
or introduce unknown bugs, please use it carefully and with diligence!

```tsx
export function ParentComponent(props: ParentComponentProps) {
  // By using this hook, the component will always re-render whenever
  // a child using a ProviderModule which is also imported into the parent ProviderModule,
  // has mounted and rendered!
  useRerenderOnChildrenModuleContextLoaded();

  // We should use the `useInjectOnRender` instead of the default `useInject`
  // hook which re-uses the same instance of the injected dependency
  // between re-renders.
  //
  // Note: It may still work with the `useInject` hook too, but it may not be predictable.
  const service = useInjectOnRender(ParentService);

  // At this point the `service.randomNumberService` instance should be the one
  // from the `RandomNumberComponent` below.
  //
  // Note: Expect during the 1st render cycle to not be the same instance as the one used by the child component!
  // The `xInjection` container will still supply the correct provider to the
  // constructor parameter, but it'll be a new transient instance.
  console.log(service.randomNumberService.generate());

  // As we are now using the `useRerenderOnChildrenModuleContextLoaded` hook
  // there's no need anymore for the `TapIntoComponent` wrapper.
  return <RandomNumberComponent />;
}
```

## Documentation

Comprehensive, auto-generated documentation is available at:

👉 [https://adimarianmutu.github.io/x-injection-reactjs/index.html](https://adimarianmutu.github.io/x-injection-reactjs/index.html)

## Contributing

Pull requests are warmly welcomed! 😃

Please ensure your contributions adhere to the project's code style. See the repository for more details.

---

> For questions, feature requests, or bug reports, feel free to open an [issue](https://github.com/AdiMarianMutu/x-injection-reactjs/issues) on GitHub!
