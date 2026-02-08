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

**Powerful dependency injection for React components using a modular architecture. Build scalable React applications with clean separation of concerns.** _(Inspired by Angular and NestJS IoC/DI)_

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [The Problem](#the-problem)
  - [Without xInjection](#without-xinjection)
  - [With xInjection](#with-xinjection)
- [Core Concepts](#core-concepts)
  - [Component Modules](#component-modules)
  - [Services](#services)
  - [Dependency Injection](#dependency-injection)
  - [Custom Hooks](#custom-hooks)
- [Examples](#examples)
  - [Zustand Integration](#zustand-integration)
  - [Parent-Child Provider Control](#parent-child-provider-control)
- [Advanced Usage](#advanced-usage)
  - [Module Imports and Exports](#module-imports-and-exports)
  - [Multiple Dependency Injection](#multiple-dependency-injection)
- [Unit Testing](#unit-testing)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Overview

xInjection for React brings dependency injection to your React components, enabling:

- **Service-based architecture**: Separate business logic from UI components
- **Modular design**: Create reusable, testable component modules
- **State management integration**: Works seamlessly with Zustand, Redux, or any state library
- **Parent-child provider control**: Parent components can control child component dependencies

This is the official [ReactJS](https://react.dev/) implementation of [xInjection](https://github.com/AdiMarianMutu/x-injection).

## Installation

```sh
npm i @adimm/x-injection-reactjs reflect-metadata
```

**TypeScript Configuration**

Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Quick Start

```tsx
import { Injectable, provideModuleToComponent, ProviderModule, useInject } from '@adimm/x-injection-reactjs';

// 1. Define a service
@Injectable()
class UserService {
  firstName = 'John';
  lastName = 'Doe';
}

// 2. Create a module blueprint
const UserDashboardModuleBp = ProviderModule.blueprint({
  id: 'UserDashboardModule',
  providers: [UserService],
});

// 3. Create a component with dependency injection
const UserDashboard = provideModuleToComponent(UserDashboardModuleBp, () => {
  const userService = useInject(UserService);

  return (
    <h1>
      Hello {userService.firstName} {userService.lastName}!
    </h1>
  );
});
```

## The Problem

React apps often suffer from **provider hell**, **prop drilling**, and **manual dependency wiring**:

### Without xInjection

```tsx
// Problem 1: Provider Hell
<AuthProvider>
  <ApiProvider>
    <ToastProvider>
      <App />
    </ToastProvider>
  </ApiProvider>
</AuthProvider>;

// Problem 2: Manual Dependency Wiring
function UserProfile() {
  // Must manually create ALL dependencies in correct order
  const toast = new ToastService();
  const api = new ApiService();
  const auth = new AuthService(api);
  const userProfile = new UserProfileService(api, auth, toast);

  // If AuthService adds a dependency, ALL consumers break!
  return <div>{userProfile.displayName}</div>;
}
```

### With xInjection

```tsx
// 1. Define global services (shared across all components) - Usually in your app entrypoint/bootstrap file.
const AppModuleBp = ProviderModule.blueprint({
  id: 'AppModule',
  isGlobal: true, // Available everywhere, only created once
  providers: [ToastService, ApiService, AuthService],
});

// 2. Define component-specific services - Per component
const UserProfileModuleBp = ProviderModule.blueprint({
  id: 'UserProfileModule',
  providers: [UserProfileService], // Automatically gets ApiService, AuthService, ToastService
});

const UserProfile = provideModuleToComponent(UserProfileModuleBp, () => {
  const userProfile = useInject(UserProfileService);
  // IoC automatically injects: ToastService → ApiService → AuthService → UserProfileService
  return <div>{userProfile.displayName}</div>;
});
```

**What You Get:**

- **No Provider Hell** - One module replaces nested providers
- **Auto Dependency Resolution** - IoC wires everything automatically
- **Easy Refactoring** - Add/remove dependencies without breaking consumers
- **Clean Separation** - Business logic in services, UI in components
- **Fully Testable** - Mock modules or individual services
- **Type-Safe** - Full TypeScript support

## Core Concepts

### Component Modules

Create a module blueprint that defines your component's dependencies:

```ts
// user-dashboard.module.ts
export const UserDashboardModuleBp = ProviderModule.blueprint({
  id: 'UserDashboardModule',
  providers: [UserService],
  exports: [UserService],
});
```

**Blueprint vs Module:** Use a **blueprint** for reusable components (multiple instances), use a raw **module** for singleton components (single instance).

### Services

Define services using the `@Injectable()` decorator:

```ts
// user-dashboard.service.ts
@Injectable()
export class UserDashboardService {
  firstName: string;
  lastName: string;

  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }
}
```

### Dependency Injection

Use `useInject` to access services in your components:

```tsx
const UserDashboard = provideModuleToComponent(UserDashboardModuleBp, () => {
  const userService = useInject(UserService);

  return <div>{userService.getFullName()}</div>;
});
```

### Custom Hooks

Create reusable hooks with dependency injection using `hookFactory`:

```ts
const useUserFullName = hookFactory({
  use: ({ firstName, lastName, deps: [userService] }) => {
    userService.firstName = firstName;
    userService.lastName = lastName;
    return userService.getFullName();
  },
  inject: [UserService],
});

// Use in any component
const fullName = useUserFullName({ firstName: 'John', lastName: 'Doe' });
```

## Examples

### Zustand Integration

This example shows how to integrate Zustand store within a service, allowing the service to manipulate the store while components only subscribe to state changes.

```ts
// counter.service.ts

import { Injectable } from '@adimm/x-injection-reactjs';
import { create } from 'zustand';

interface CounterStore {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

@Injectable()
export class CounterService {
  // Store instance encapsulated within the service
  private readonly store = create<CounterStore>((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
    decrement: () => set((state) => ({ count: state.count - 1 })),
    reset: () => set({ count: 0 }),
  }));

  // Expose store hook for components to subscribe
  get useStore() {
    return this.store;
  }

  // Getter to access current state from within the service
  private get storeState() {
    return this.store.getState();
  }

  // Business logic methods
  increment() {
    this.storeState.increment();
  }

  decrement() {
    this.storeState.decrement();
  }

  reset() {
    this.storeState.reset();
  }

  incrementBy(amount: number) {
    // Complex logic lives in the service
    const currentCount = this.storeState.count;
    this.store.setState({ count: currentCount + amount });
  }

  async incrementAsync() {
    // Handle async operations in the service
    await new Promise((resolve) => setTimeout(resolve, 1000));
    this.increment();
  }
}
```

```ts
// counter.module.ts

import { ProviderModule } from '@adimm/x-injection-reactjs';

import { CounterService } from './counter.service';

export const CounterModuleBp = ProviderModule.blueprint({
  id: 'CounterModule',
  providers: [CounterService],
  exports: [CounterService],
});
```

```tsx
// counter.component.tsx

import { provideModuleToComponent, useInject } from '@adimm/x-injection-reactjs';

import { CounterModuleBp } from './counter.module';
import { CounterService } from './counter.service';

const Counter = provideModuleToComponent(CounterModuleBp, () => {
  // Inject service for business logic
  const counterService = useInject(CounterService);

  // Subscribe to store for reactive state
  const count = counterService.useStore((state) => state.count);

  return (
    <div>
      <h2>Count: {count}</h2>
      <button onClick={() => counterService.increment()}>+1</button>
      <button onClick={() => counterService.decrement()}>-1</button>
      <button onClick={() => counterService.incrementBy(5)}>+5</button>
      <button onClick={() => counterService.incrementAsync()}>+1 Async</button>
      <button onClick={() => counterService.reset()}>Reset</button>
    </div>
  );
});

export default Counter;
```

**Key Benefits:**

- **Encapsulation**: Store is encapsulated within the service, not exposed globally
- **Separation of concerns**: Business logic in services, UI only subscribes to state
- **Testability**: Services are self-contained and easy to test
- **Reusability**: Services with stores can be shared across components via dependency injection
- **Type safety**: Full TypeScript support throughout

### Parent-Child Provider Control

Parent components can control child component dependencies using the `inject` prop:

```ts
// Child module and service
const ChildModuleBp = ProviderModule.blueprint({
  id: 'ChildModule',
  providers: [ChildService],
  exports: [ChildService],
});

// Parent module
const ParentModuleBp = ProviderModule.blueprint({
  id: 'ParentModule',
  providers: [ParentService, ChildService],
  exports: [ParentService, ChildService],
});

// Parent component controls child's service
const ParentComponent = provideModuleToComponent(ParentModuleBp, () => {
  const childService = useInject(ChildService);

  // Override child's ChildService with parent's instance
  return <ChildComponent inject={[{ provide: ChildService, useValue: childService }]} />;
});
```

This pattern is useful for:

- Building composable component hierarchies
- Sharing state between parent and child components
- Creating flexible component APIs

## Advanced Usage

### Module Imports and Exports

Modules can import and re-export other modules:

```ts
const DropdownModuleBp = ProviderModule.blueprint({
  id: 'DropdownModule',
  imports: [ListviewModuleBp], // Import ListviewModule
  providers: [DropdownService],
  exports: [
    ListviewModuleBp, // Re-export imported module
    DropdownService,
  ],
});
```

### Multiple Dependency Injection

Use `useInjectMany` to inject multiple dependencies:

```ts
const [userService, apiService] = useInjectMany([UserService, ApiService]);
```

## Unit Testing

Mock modules easily for testing:

```tsx
import { act, render } from '@testing-library/react';

// Original module
const ApiModuleBp = ProviderModule.blueprint({
  id: 'ApiModule',
  providers: [UserService, ApiService],
});

// Create mocked version
const ApiModuleBpMocked = ApiModuleBp.clone().updateDefinition({
  id: 'ApiModuleMocked',
  providers: [
    { provide: UserService, useClass: UserServiceMock },
    {
      provide: ApiService,
      useValue: {
        sendRequest: vi.fn().mockResolvedValue({ data: 'mocked' }),
      },
    },
  ],
});

// Test with mocked module
await act(async () => render(<MyComponent module={ApiModuleBpMocked} />));
```

**Testing with Zustand:**

```tsx
import { act, renderHook } from '@testing-library/react';

import { CounterService } from './counter.service';

it('should increment counter via service', () => {
  const service = new CounterService();

  const { result } = renderHook(() => service.useStore((s) => s.count));

  expect(result.current).toBe(0);

  act(() => {
    service.increment();
  });

  expect(result.current).toBe(1);
});

it('should handle complex business logic', () => {
  const service = new CounterService();

  act(() => {
    service.incrementBy(10);
  });

  expect(service.useStore.getState().count).toBe(10);
});
```

## Documentation

📚 **Full API Documentation:** [https://adimarianmutu.github.io/x-injection-reactjs](https://adimarianmutu.github.io/x-injection-reactjs/index.html)

For more information about the base library, see [xInjection Documentation](https://github.com/AdiMarianMutu/x-injection#readme).

## Contributing

Pull requests are welcome! Please ensure your contributions follow the project's code style.

## License

MIT © [Adi-Marian Mutu](https://www.linkedin.com/in/mutu-adi-marian/)

---

**Questions or issues?** Open an [issue on GitHub](https://github.com/AdiMarianMutu/x-injection-reactjs/issues)
