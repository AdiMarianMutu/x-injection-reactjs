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

**Stop wrestling with React Context and prop drilling. Build scalable React apps with clean, testable business logic separated from UI.**

> **TL;DR** — Mark classes with `@Injectable()`, declare a `ProviderModule.blueprint()`, wrap your component with `provideModuleToComponent(MyModuleBp, () => { ... })`, then call `useInject(MyService)` inside. Dependencies are resolved automatically — no providers, no prop drilling, no manual wiring.

## Table of Contents

- [Table of Contents](#table-of-contents)
- [What Problems Does This Solve?](#what-problems-does-this-solve)
  - [1. Provider Hell](#1-provider-hell)
  - [2. Prop Drilling](#2-prop-drilling)
  - [3. Manual Dependency Wiring](#3-manual-dependency-wiring)
  - [4. Business Logic Mixed with UI](#4-business-logic-mixed-with-ui)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
  - [1. Services: Your Business Logic](#1-services-your-business-logic)
  - [2. Modules: Organizing Dependencies](#2-modules-organizing-dependencies)
  - [3. Injecting Services into Components](#3-injecting-services-into-components)
- [The Power of Component-Scoped Modules](#the-power-of-component-scoped-modules)
  - [What Are Component-Scoped Modules?](#what-are-component-scoped-modules)
  - [Pattern 1: Multiple Independent Instances](#pattern-1-multiple-independent-instances)
  - [Pattern 2: Parent-Child Dependency Control](#pattern-2-parent-child-dependency-control)
- [Why Use the HoC Approach?](#why-use-the-hoc-approach)
  - [1. Lifecycle-Bound Isolated Containers](#1-lifecycle-bound-isolated-containers)
  - [2. Composition and Reusability](#2-composition-and-reusability)
- [Hierarchical Dependency Injection](#hierarchical-dependency-injection)
  - [Creating Custom Hooks with Dependencies](#creating-custom-hooks-with-dependencies)
  - [Parent Components Controlling Child Dependencies](#parent-components-controlling-child-dependencies)
  - [Module Imports and Exports](#module-imports-and-exports)
- [Real-World Examples](#real-world-examples)
  - [Zustand Store Integration](#zustand-store-integration)
  - [Complex Form with Shared State](#complex-form-with-shared-state)
- [Testing Your Code](#testing-your-code)
  - [Mocking an Entire Module](#mocking-an-entire-module)
  - [Mocking on-the-fly](#mocking-on-the-fly)
- [FAQ](#faq)
  - [How do I add global services?](#how-do-i-add-global-services)
  - [When should I use global modules vs component-scoped modules?](#when-should-i-use-global-modules-vs-component-scoped-modules)
  - [Can I use this with Redux/MobX/Zustand?](#can-i-use-this-with-reduxmobxzustand)
  - [How does this compare to React Context?](#how-does-this-compare-to-react-context)
  - [If I want Angular patterns, why not just use Angular?](#if-i-want-angular-patterns-why-not-just-use-angular)
  - [Can I migrate gradually from an existing React app?](#can-i-migrate-gradually-from-an-existing-react-app)
  - [When do I actually need `provideModuleToComponent`?](#when-do-i-actually-need-providemoduletocomponent)
  - [What's the performance impact?](#whats-the-performance-impact)
  - [Why use classes for services instead of custom hooks?](#why-use-classes-for-services-instead-of-custom-hooks)
- [Links](#links)
- [Contributing](#contributing)
- [License](#license)

## What Problems Does This Solve?

If you've built React apps, you've probably encountered these pain points:

### 1. Provider Hell

Your `App.tsx` becomes a nightmare of nested providers:

```tsx
<AuthProvider>
  <ThemeProvider>
    <ApiProvider>
      <ToastProvider>
        <UserProvider>
          <App />
        </UserProvider>
      </ToastProvider>
    </ApiProvider>
  </ThemeProvider>
</AuthProvider>
```

### 2. Prop Drilling

You pass props through 5 levels of components just to reach the one that needs them:

```tsx
<Dashboard user={user}>
  <Sidebar user={user}>
    <UserMenu user={user}>
      <UserAvatar user={user} /> {/* Finally! */}
    </UserMenu>
  </Sidebar>
</Dashboard>
```

### 3. Manual Dependency Wiring

When a service needs dependencies, you manually create them in the right order:

```tsx
function UserProfile() {
  // Must create ALL dependencies manually in correct order
  const toastService = new ToastService();
  const apiService = new ApiService();
  const authService = new AuthService(apiService);
  const userProfileService = new UserProfileService(apiService, authService, toastService);

  // If AuthService adds a new dependency tomorrow, THIS BREAKS!
  return <div>{userProfileService.displayName}</div>;
}
```

### 4. Business Logic Mixed with UI

Your components become bloated with API calls, state management, and validation:

```tsx
function UserDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/user')
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setLoading(false);
      });
  }, []);

  // 50 more lines of business logic...

  return <div>{/* Your actual UI */}</div>;
}
```

xInjection solves all of the above by bringing **Inversion of Control (IoC)** and **Dependency Injection (DI)** to React: instead of components creating and managing their own dependencies, they just ask for what they need and xInjection provides it — automatically, type-safely, and testably.

This is the official [ReactJS](https://react.dev/) implementation of [xInjection](https://github.com/AdiMarianMutu/x-injection).

## Installation

```sh
npm i @adimm/x-injection-reactjs reflect-metadata
```

> [!IMPORTANT]
> Import `reflect-metadata` at the very top of your app entry point:

```tsx
// main.tsx or index.tsx

import 'reflect-metadata';

import { createRoot } from 'react-dom/client';

import App from './App';

createRoot(document.getElementById('root')!).render(<App />);
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

> **📚 Advanced Concepts**
>
> This documentation covers React-specific usage patterns. For advanced features like **lifecycle hooks** (`onReady`, `onDispose`), **injection scopes** (Singleton, Transient, Request), **middlewares**, **events**, and **dynamic module updates**, refer to the [base xInjection library documentation](https://github.com/AdiMarianMutu/x-injection).
>
> The base library provides the core IoC/DI engine that powers this React integration.

## Quick Start

Three files, three concepts: global services declared once, a component-scoped module, and a component that injects both.

**Step 1 — Declare global services** in your entry point:

```tsx
// main.tsx - Your app entry point

import 'reflect-metadata';

import { Injectable, ProviderModule } from '@adimm/x-injection';
import { createRoot } from 'react-dom/client';

import App from './App';

// Global services (singletons)
@Injectable()
class ApiService {
  get(url: string) {
    return fetch(url).then((r) => r.json());
  }
}

@Injectable()
class AuthService {
  constructor(private readonly apiService: ApiService) {}

  isLoggedIn = false;

  login() {
    this.isLoggedIn = true;
  }
}

// Create global module - automatically imported into built-in AppModule
ProviderModule.blueprint({
  id: 'AppBootstrapModule',
  isGlobal: true,
  providers: [ApiService, AuthService],
  exports: [ApiService, AuthService], // Exported services available everywhere
});

// Now render your app
createRoot(document.getElementById('root')!).render(<App />);
```

**Step 2 — Create a component-scoped module and inject services:**

```tsx
// UserDashboard.tsx - A component with its own service

import { Injectable, ProviderModule } from '@adimm/x-injection';
import { provideModuleToComponent, useInject } from '@adimm/x-injection-reactjs';

// Component-scoped service
@Injectable()
class UserDashboardService {
  constructor(private readonly apiService: ApiService) {} // Gets global ApiService

  async loadUser() {
    return this.apiService.get('/user');
  }
}

// Component-scoped module
const UserDashboardModuleBp = ProviderModule.blueprint({
  id: 'UserDashboardModule',
  providers: [UserDashboardService],
});

// Component with injected service
export const UserDashboard = provideModuleToComponent(UserDashboardModuleBp, () => {
  const dashboardService = useInject(UserDashboardService);
  const authService = useInject(AuthService); // Can also inject global services

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Logged in: {authService.isLoggedIn ? 'Yes' : 'No'}</p>
    </div>
  );
});
```

**Step 3 — Use the component** — each instance gets its own module:

```tsx
// App.tsx

import { UserDashboard } from './UserDashboard';

export default function App() {
  return (
    <div>
      <UserDashboard />
      <UserDashboard /> {/* Each gets its own UserDashboardService */}
    </div>
  );
}
```

> [!TIP] Global vs component-scoped services:
>
> - Global services (`ApiService`, `AuthService`): Defined in a global blueprint, automatically imported into the built-in `AppModule`
> - Component-scoped services (`UserDashboardService`): Fresh instance per `<UserDashboard />`
> - Component-scoped services can inject global services automatically

## How It Works

Let's break down the three main concepts you'll use:

### 1. Services: Your Business Logic

A **service** is just a class that contains your business logic. Think of it as extracting all the "smart stuff" from your component into a reusable, testable class.

```tsx
@Injectable()
class TodoService {
  private todos: Todo[] = [];

  addTodo(text: string) {
    this.todos.push({ id: Date.now(), text, completed: false });
  }

  getTodos() {
    return this.todos;
  }

  toggleTodo(id: number) {
    const todo = this.todos.find((t) => t.id === id);
    if (todo) todo.completed = !todo.completed;
  }
}
```

The `@Injectable()` decorator marks this class as something that can be injected (either into components or other services/modules).

**Services can depend on other services:**

```tsx
@Injectable()
class UserProfileService {
  // Dependencies are automatically injected via constructor
  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
    private readonly toastService: ToastService
  ) {}

  async loadProfile() {
    try {
      const userId = this.authService.getCurrentUserId();
      const profile = await this.apiService.get(`/users/${userId}`);
      return profile;
    } catch (error) {
      this.toastService.error('Failed to load profile');
      throw error;
    }
  }
}
```

Notice how `UserProfileService` asks for its dependencies in the constructor? xInjection will automatically provide them.

**Alternative: Property Injection**

You can also use the `@Inject` decorator from the base library for property injection:

```tsx
import { Inject, Injectable } from '@adimm/x-injection';

@Injectable()
class UserProfileService {
  @Inject(ApiService)
  private readonly apiService!: ApiService;

  @Inject(AuthService)
  private readonly authService!: AuthService;

  async loadProfile() {
    const userId = this.authService.getCurrentUserId();
    return this.apiService.get(`/users/${userId}`);
  }
}
```

Both approaches work! Constructor injection is generally preferred for better type safety and easier testing.

### 2. Modules: Organizing Dependencies

A **module** is a container that tells xInjection which services are available. Think of it as a "package" of services.

**Modules come in two flavors:**

```tsx
// Global module: Created once, shared everywhere
ProviderModule.blueprint({
  id: 'AppBootstrapModule',
  isGlobal: true,
  providers: [ApiService, AuthService, ToastService],
  exports: [ApiService, AuthService, ToastService], // Only exported services become globally available
});

// Component-scoped module: Each component instance gets its own
const TodoListModuleBp = ProviderModule.blueprint({
  id: 'TodoListModule',
  providers: [TodoService], // Gets a fresh TodoService per component
});
```

> [!IMPORTANT]
> When using `isGlobal: true`, only services listed in the `exports` array become globally available. Non-exported providers remain private to the module.

> [!CAUTION] Global modules cannot be used with `provideModuleToComponent`
> Attempting to provide a global module to a component will throw an `InjectionProviderModuleError`. Global services are accessed directly via `useInject` without the HoC.

**`blueprint()` vs `create()`:**

- **`blueprint()`**: A deferred module template. Each time it is imported or used with `provideModuleToComponent`, a **new independent instance** is created. Use for the global bootstrap module and for component-scoped modules. [Learn more](https://github.com/AdiMarianMutu/x-injection?tab=readme-ov-file#blueprints).
- **`create()`**: Immediately instantiates a module. The resulting instance is a **single shared object** — every module that imports it shares the exact same instance. Use when you need a module that is instantiated once and shared across multiple other modules.

See [Module Imports and Exports](#module-imports-and-exports) for examples of both.

> [!CAUTION] Never import `AppModule` into other modules
> `AppModule` is the built-in global container and importing it will throw an error. Use global blueprints with `isGlobal: true` instead, which are automatically imported into `AppModule`.

### 3. Injecting Services into Components

Use the `provideModuleToComponent` Higher-Order Component (HoC) to give your component access to services:

```tsx
const UserDashboard = provideModuleToComponent(UserDashboardModuleBp, () => {
  // Inject the service you need
  const userProfileService = useInject(UserProfileService);

  return <div>{userProfileService.displayName}</div>;
});
```

The HoC does two things:

1. Creates an instance of your module (and all its services)
2. Makes those services available via the `useInject` hook

**You can also inject multiple services at once:**

```tsx
const MyComponent = provideModuleToComponent(MyModuleBp, () => {
  const [userService, apiService] = useInjectMany(UserService, ApiService);

  // Use your services...
});
```

## The Power of Component-Scoped Modules

One of the most powerful features of xInjection is **component-scoped modules**. This is something you can't easily achieve with React Context alone.

### What Are Component-Scoped Modules?

When you use `provideModuleToComponent`, each instance of your component gets its **own copy** of the module and all its services. This enables powerful patterns:

### Pattern 1: Multiple Independent Instances

```tsx
@Injectable()
class CounterService {
  count = 0;
  increment() {
    this.count++;
  }
}

const CounterModuleBp = ProviderModule.blueprint({
  id: 'CounterModule',
  providers: [CounterService],
});

const Counter = provideModuleToComponent(CounterModuleBp, () => {
  const counterService = useInject(CounterService);
  return (
    <div>
      <p>Count: {counterService.count}</p>
      <button onClick={() => counterService.increment()}>+</button>
    </div>
  );
});

function App() {
  return (
    <div>
      <Counter /> {/* Count: 0 */}
      <Counter /> {/* Count: 0 (separate instance!) */}
    </div>
  );
}
```

Each `<Counter />` has its own `CounterService`, so they don't interfere with each other.

### Pattern 2: Parent-Child Dependency Control

Parent components can "inject" specific service instances into their children:

```tsx
const ParentModuleBp = ProviderModule.blueprint({
  id: 'ParentModule',
  providers: [SharedService, ParentService],
});

const ChildModuleBp = ProviderModule.blueprint({
  id: 'ChildModule',
  providers: [SharedService, ChildService],
});

const Child = provideModuleToComponent(ChildModuleBp, () => {
  const sharedService = useInject(SharedService);
  return <div>{sharedService.data}</div>;
});

const Parent = provideModuleToComponent(ParentModuleBp, () => {
  const sharedService = useInject(SharedService);

  // Pass the parent's SharedService instance to the child
  return <Child inject={[{ provide: SharedService, useValue: sharedService }]} />;
});
```

This enables complex patterns like form components sharing validation services, or composite UI components coordinating state.

## Why Use the HoC Approach?

You might wonder: "Why wrap my component with `provideModuleToComponent` instead of just using `useInject` directly everywhere?"

**Short answer:** You don't always need it! If you only use global services, you can just call `useInject` anywhere. But for **component-scoped modules** (where each component instance needs its own services), you need `provideModuleToComponent`.

The Higher-Order Component (HoC) pattern provides several key benefits:

### 1. Lifecycle-Bound Isolated Containers

Each wrapped component gets its **own** dependency container, created on mount and disposed on unmount. Two instances of `<TodoList />` each get their own `TodoService` — they never share state. When the component unmounts, `onDispose` runs automatically, cleaning up only that component's services. Imported global services remain unaffected.

### 2. Composition and Reusability

The HoC pattern works seamlessly with React's component composition model:

```tsx
// Reusable component with its own dependencies
const TodoList = provideModuleToComponent(TodoListModuleBp, () => {
  const todoService = useInject(TodoService);
  // ...
});

// Use it multiple times, each with isolated state
function App() {
  return (
    <>
      <TodoList /> {/* Gets its own TodoService */}
      <TodoList /> {/* Gets a different TodoService */}
    </>
  );
}
```

## Hierarchical Dependency Injection

Every component wrapped with `provideModuleToComponent` gets its own module container. When `useInject` is called inside that component, xInjection walks a well-defined lookup chain:

1. **Own module** — services declared in the component's own blueprint
2. **Imported modules** — exported services from modules listed in `imports`
3. **AppModule** — globally available services (from `isGlobal: true` blueprints)

```
useInject(SomeService)  ← called inside <MyComponent />
          │
          ▼
┌─────────────────────────┐
│   MyComponent's module  │  ← providers: [MyService, ...]
│     (own container)     │
└───────────┬─────────────┘
            │ not found
            ▼
┌─────────────────────────┐
│   Imported modules      │  ← imports: [SharedModule]
│   (exported only)       │     SharedModule.exports: [SharedService]
└───────────┬─────────────┘
            │ not found
            ▼
┌─────────────────────────┐
│       AppModule         │  ← AppBootstrapModule { isGlobal: true }
│  (global services)      │     exports: [ApiService, AuthService, ...]
└───────────┬─────────────┘
            │ not found
            ▼
      throws error
```

**Component example:**

```tsx
// ① Global services — live in AppModule, available everywhere
@Injectable()
class ApiService {}
@Injectable()
class AuthService {}

ProviderModule.blueprint({
  id: 'AppBootstrapModule',
  isGlobal: true,
  providers: [ApiService, AuthService],
  exports: [ApiService, AuthService],
});

// ② Shared module — created once, imported into component blueprints
@Injectable()
class AnalyticsService {}

const SharedModule = ProviderModule.create({
  id: 'SharedModule',
  providers: [AnalyticsService],
  exports: [AnalyticsService], // ✅ visible to importers
});

// ③ Component-scoped service — private to this component
@Injectable()
class DashboardService {
  constructor(
    private readonly api: ApiService, // resolved from ③ AppModule
    private readonly analytics: AnalyticsService // resolved from ② SharedModule
  ) {}
}

const DashboardModuleBp = ProviderModule.blueprint({
  id: 'DashboardModule',
  imports: [SharedModule],
  providers: [DashboardService], // ① own container
});

const Dashboard = provideModuleToComponent(DashboardModuleBp, () => {
  const dashboard = useInject(DashboardService); // ✅ ① own module
  const analytics = useInject(AnalyticsService); // ✅ ② SharedModule export
  const auth = useInject(AuthService); // ✅ ③ AppModule (global)

  // useInject(SomePrivateService)               // ❌ not found → error
});
```

> [!TIP]
> A service that is not listed in a module's `exports` is completely invisible to any component that imports that module. This is how xInjection enforces encapsulation — only what you explicitly export crosses the module boundary.

### Creating Custom Hooks with Dependencies

The `hookFactory` function lets you create reusable custom hooks that automatically receive injected dependencies:

```tsx
// Define a custom hook with dependencies
const useUserProfile = hookFactory({
  use: ({ userId, deps: [apiService, authService] }) => {
    const [profile, setProfile] = useState(null);

    useEffect(() => {
      apiService.get(`/users/${userId}`).then(setProfile);
    }, [userId]);

    return profile;
  },
  inject: [ApiService, AuthService],
});

// Use it in any component
const UserProfile = provideModuleToComponent<{ userId: number }>(UserModuleBp, ({ userId }) => {
  const profile = useUserProfile({ userId });
  return <div>{profile?.name}</div>;
});
```

**Type-safe hooks with `HookWithDeps`:**

Use the `HookWithDeps<P, D>` type utility for full TypeScript support:

```tsx
import type { HookWithDeps } from '@adimm/x-injection-reactjs';

// Hook with no parameters - use void as first generic
const useTestHook = hookFactory({
  use: ({ deps: [testService] }: HookWithDeps<void, [TestService]>) => {
    return testService.value;
  },
  inject: [TestService],
});

// Hook with parameters - specify parameter type as first generic
const useUserData = hookFactory({
  use: ({ userId, deps: [apiService] }: HookWithDeps<{ userId: number }, [ApiService]>) => {
    const [data, setData] = useState(null);
    useEffect(() => {
      apiService.get(`/users/${userId}`).then(setData);
    }, [userId]);
    return data;
  },
  inject: [ApiService],
});

// Usage:
useTestHook(); // No parameters
useUserData({ userId: 123 }); // With parameters
```

**`HookWithDeps<P, D>` generics:**

- **`P`**: Hook parameter type (use `void` if no parameters, or `{ param1: type, ... }` for parameters)
- **`D`**: Tuple type matching your `inject` array (e.g., `[ApiService, AuthService]`)

> [!TIP] Why use hookFactory?
>
> - Dependencies are automatically injected
> - Hooks are reusable across components
> - Type-safe with TypeScript
> - Easier to test (mock dependencies)

### Parent Components Controlling Child Dependencies

The `inject` prop allows parent components to override child component dependencies. See [Pattern 2](#pattern-2-parent-child-dependency-control) for a basic example and the [Complex Form example](#complex-form-with-shared-state) for a real-world use case.

### Module Imports and Exports

Modules can import other modules. The key question is: **should the imported module be shared or duplicated per component?**

**Shared module instance → `ProviderModule.create()`:**

Use `create()` when a module should exist as one instance and be shared by all blueprints that import it:

```tsx
// Instantiated once — all importers share the same instance and the same singletons
const CoreModule = ProviderModule.create({
  id: 'CoreModule',
  providers: [SomeSharedService],
  exports: [SomeSharedService],
});

const UserModuleBp = ProviderModule.blueprint({
  id: 'UserModule',
  imports: [CoreModule], // every <UserComponent /> shares the same CoreModule
  providers: [UserService],
});

const ProductModuleBp = ProviderModule.blueprint({
  id: 'ProductModule',
  imports: [CoreModule], // same CoreModule instance
  providers: [ProductService],
});
```

**Per-component isolation → blueprint imports:**

Import a blueprint when each component instance should get its own independent copy of those providers:

```tsx
const UserModuleBp = ProviderModule.blueprint({
  id: 'UserModule',
  imports: [FormValidationModuleBp], // each <UserComponent /> gets its own FormValidationService
  providers: [UserService],
});
```

**Re-exporting:**

```tsx
const CoreModule = ProviderModule.create({
  id: 'CoreModule',
  imports: [DatabaseModule, CacheModule],
  exports: [DatabaseModule, CacheModule], // expose both to importers
});
```

## Real-World Examples

### Zustand Store Integration

xInjection works beautifully with Zustand. The pattern is simple: **encapsulate the Zustand store inside a service**. This keeps your business logic in services while using Zustand for reactive state.

**Why this pattern?**

- Business logic stays in services (testable, reusable)
- Components subscribe to state reactively (optimal re-renders)
- Store is scoped to the component (no global state pollution)
- Type-safe and easy to test

```ts
// counter.service.ts

import { Injectable } from '@adimm/x-injection';
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

import { ProviderModule } from '@adimm/x-injection';

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

### Complex Form with Shared State

This example demonstrates a powerful pattern: a parent form component controlling the state of multiple child input components.

```tsx
import { Inject, Injectable, InjectionScope } from '@adimm/x-injection';

// 1. Input service - manages a single input's state
@Injectable()
class InputService {
  value = '';
  error = '';

  setValue(value: string) {
    this.value = value;
    this.validate();
  }

  validate() {
    if (!this.value) {
      this.error = 'Required';
    } else if (this.value.length < 3) {
      this.error = 'Too short';
    } else {
      this.error = '';
    }
    return !this.error;
  }
}

// 2. Form service - manages the entire form
@Injectable()
class FormService {
  constructor(
    public readonly nameInput: InputService,
    public readonly emailInput: InputService
  ) {
    // Initialize with default values
    this.nameInput.setValue('');
    this.emailInput.setValue('');
  }

  isValid() {
    return this.nameInput.validate() && this.emailInput.validate();
  }

  submit() {
    if (this.isValid()) {
      console.log('Submitting:', {
        name: this.nameInput.value,
        email: this.emailInput.value,
      });
    }
  }
}

// 3. Input component
const InputModuleBp = ProviderModule.blueprint({
  id: 'InputModule',
  providers: [InputService],
  exports: [InputService],
});

const Input = provideModuleToComponent<{ label: string }>(InputModuleBp, ({ label }) => {
  const inputService = useInject(InputService);
  const [value, setValue] = useState(inputService.value);

  return (
    <div>
      <label>{label}</label>
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          inputService.setValue(e.target.value);
        }}
      />
      {inputService.error && <span style={{ color: 'red' }}>{inputService.error}</span>}
    </div>
  );
});

// 4. Form component - injects its InputService instances into child Input components
const FormModuleBp = ProviderModule.blueprint({
  id: 'FormModule',
  imports: [
    // Clone InputModuleBp and override its defaultScope to Transient for this specific use.
    // Without Transient, both `nameInput` and `emailInput` in FormService would resolve to
    // the same singleton — they'd share state. Transient ensures each @Inject(InputService)
    // parameter in FormService's constructor gets its own independent instance.
    // This is also a good showcase of blueprint dynamicity: the original InputModuleBp is
    // left untouched, and only this consumer opts into Transient behavior.
    InputModuleBp.clone().updateDefinition({
      ...InputModuleBp.getDefinition(),
      defaultScope: InjectionScope.Transient,
    }),
  ],
  providers: [FormService],
  exports: [FormService],
});

const Form = provideModuleToComponent(FormModuleBp, () => {
  const formService = useInject(FormService);

  return (
    <form>
      {/* Pass the form's InputService instances to the inputs */}
      <Input inject={[{ provide: InputService, useValue: formService.nameInput }]} label="Name" />
      <Input inject={[{ provide: InputService, useValue: formService.emailInput }]} label="Email" />
      <button type="button" onClick={() => formService.submit()}>
        Submit
      </button>
    </form>
  );
});
```

**What's happening here?**

1. Each `Input` component normally gets its own `InputService`
2. The `Form` component creates two `InputService` instances in its constructor
3. The form **overrides** the input's services using the `inject` prop
4. All inputs share state through the parent form's services

## Testing Your Code

xInjection makes testing easy. You can mock entire modules or individual services.

### Mocking an Entire Module

```tsx
import { act, render } from '@testing-library/react';

// Original module
const UserModuleBp = ProviderModule.blueprint({
  id: 'UserModule',
  providers: [UserService, ApiService],
});

// Create a mocked version
const UserModuleMocked = UserModuleBp.clone().updateDefinition({
  id: 'UserModuleMocked',
  providers: [
    {
      provide: UserService,
      useClass: UserServiceMock, // Your mock class
    },
    {
      provide: ApiService,
      useValue: {
        get: vi.fn().mockResolvedValue({ name: 'Test User' }),
        post: vi.fn(),
      },
    },
  ],
});

// Test with the mocked module
it('should render user data', async () => {
  await act(async () => render(<UserProfile module={UserModuleMocked} />));

  // Assert...
});
```

### Mocking on-the-fly

```tsx
import { act, render } from '@testing-library/react';

it('should render user data', async () => {
  await act(async () =>
    render(
      <UserProfile
        inject={{
          provide: ApiService,
          useValue: {
            get: vi.fn().mockResolvedValue({ name: 'Test User' }),
            post: vi.fn(),
          },
        }}
      />
    )
  );

  // Assert...
});
```

## FAQ

### How do I add global services?

**Recommended:** Use a global blueprint with `isGlobal: true` in your entry point — see [Quick Start](#quick-start) and [Modules: Organizing Dependencies](#2-modules-organizing-dependencies) for the full pattern.

**For runtime additions**, use the built-in `AppModule` directly:

```tsx
import { AppModule } from '@adimm/x-injection';

AppModule.update.addProvider(ApiService, true); // true = also export
```

> [!WARNING]
> The library provides a built-in `AppModule`. Don't create your own module named "AppModule"—use one of the methods above instead.

### When should I use global modules vs component-scoped modules?

**Global** (`isGlobal: true` + `exports`): API clients, auth state, routing, theme, toast notifications — accessed directly via `useInject` without a HoC.

**Component-scoped** (blueprint without `isGlobal`): Form state, component-specific business logic, UI state — must use `provideModuleToComponent`; each instance gets its own module.

### Can I use this with Redux/MobX/Zustand?

Yes! xInjection is state-library agnostic. Encapsulate your state management library inside a service:

```tsx
@Injectable()
class TodoStore {
  private store = create<TodoState>(...);

  get useStore() {
    return this.store;
  }

  addTodo(text: string) {
    this.store.setState(...);
  }
}
```

### How does this compare to React Context?

| Feature                         | xInjection | React Context |
| ------------------------------- | ---------- | ------------- |
| Automatic dependency resolution | ✅         | ❌            |
| Component-scoped instances      | ✅         | ❌            |
| No provider hell                | ✅         | ❌            |
| Parent-child dependency control | ✅         | ❌            |
| Works with class-based logic    | ✅         | ❌            |
| Testability                     | ✅         | ⚠️            |
| TypeScript support              | ✅         | ⚠️            |

### If I want Angular patterns, why not just use Angular?

Because you want React's component model, hooks, and ecosystem — but need better architecture for complex business logic. xInjection brings IoC/DI to React without the framework lock-in.

That said, if your app is simple, React Context + hooks is perfectly fine. xInjection shines in larger codebases with complex business logic, many modules, or a need for component-scoped service instances.

### Can I migrate gradually from an existing React app?

Absolutely! Start with one component:

1. Extract business logic into a service
2. Create a module for that service
3. Wrap the component with `provideModuleToComponent`

You can use xInjection alongside Context, Redux, or any other state management.

### When do I actually need `provideModuleToComponent`?

**Don't need it (just use `useInject`):** All your services are global/singleton — API client, auth service, theme service.

**Need it:** You want multiple independent component instances (forms, modals, dialogs), or parent needs to control child dependencies via the `inject` prop.

See [Why Use the HoC Approach?](#why-use-the-hoc-approach) for a full explanation.

### What's the performance impact?

Minimal. The dependency container is lightweight, and services are created lazily (only when first requested). The HoC pattern has no performance overhead compared to standard React patterns.

**Runtime vs Build-time:** This library works entirely at runtime (not build-time):

- Runtime DI is more flexible (dynamic module loading, testing)
- Performance impact is negligible (container operations are fast)
- You get runtime debugging and introspection
- Works with all bundlers/tools without special configuration

### Why use classes for services instead of custom hooks?

Both approaches work! Here's when classes shine:

**Classes are better for:**

- Complex business logic (multiple methods, private state)
- Dependency injection (automatic wiring)
- Testing (easier to mock)
- Encapsulation (private members, getters/setters)

**Hooks are better for:**

- Simple component logic
- React-specific features (useState, useEffect)
- Functional programming style

**You can use both!** Use classes for services, hooks for UI logic. The `hookFactory` even lets you create hooks that inject class-based services.

**Note:** Services are classes, but components are still functional! You write normal React functional components with hooks—only the business logic is in classes.

## Links

📚 **Full API Documentation:** [https://adimarianmutu.github.io/x-injection-reactjs](https://adimarianmutu.github.io/x-injection-reactjs/index.html)

🔧 **Base Library:** [xInjection](https://github.com/AdiMarianMutu/x-injection)

💡 **Issues & Feature Requests:** [GitHub Issues](https://github.com/AdiMarianMutu/x-injection-reactjs/issues)

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

Please ensure your code follows the project's style and all tests pass.

## License

MIT © [Adi-Marian Mutu](https://www.linkedin.com/in/mutu-adi-marian/)

---

Made with ❤️ for the React community. If you find this library helpful, consider giving it a ⭐ on [GitHub](https://github.com/AdiMarianMutu/x-injection-reactjs)!
