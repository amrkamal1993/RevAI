# 🌐 Supported Languages & Frameworks Matrix (Expert Instructions)

RevAI automatically analyzes modified files in your Git diff and applies specialized, expert-level architectural rules for each language and framework.

---

## 📊 Comprehensive Framework & Language Matrix

| Framework / Language | Relevant Extensions | Key Audit Focus Areas | Active Preloaded Rules |
| :--- | :--- | :--- | :--- |
| **Flutter & Dart** | `.dart` | `mounted` checks, controller leaks, `const` rebuilds, Riverpod/Provider over-subscriptions | `FLUTTER-001` - `FLUTTER-005` |
| **React & Next.js** | `.tsx`, `.jsx`, `.ts`, `.js` | Stale closures, missing hook deps, Server Component secret leaks, Server Action auth | `REACT-001` - `REACT-003`, `NEXT-001` - `NEXT-002` |
| **FastAPI & Python** | `.py` | Event loop blocking with sync I/O, DB session leaks in `Depends`, Pydantic validation | `FASTAPI-001` - `FASTAPI-002`, `PY-001` - `PY-004` |
| **Django & Flask** | `.py` | ORM N+1 queries (`select_related`), unhandled exceptions, raw SQL injection | `DJANGO-001`, `PY-001` - `PY-004` |
| **Node.js, Express & NestJS** | `.ts`, `.js` | Sync I/O blocking event loop, singleton provider user state leaks, unhandled rejections | `NODE-001`, `NEST-001`, `TS-001` - `TS-005` |
| **Spring Boot & Java/Kotlin** | `.java`, `.kt` | `@Transactional` self-invocation bypass, swallowed exceptions, NullPointer safety | `SPRING-001`, `JAVA-001` |
| **Laravel & PHP** | `.php` | Eloquent N+1 eager loading (`with()`), mass assignment injection (`$request->all()`) | `LARAVEL-001` - `LARAVEL-002` |
| **Go (Golang)** | `.go` | Unclosed HTTP response bodies, Goroutine leaks, unchecked errors, long loop defers | `GO-001`, `GO-002`, `GO-004` |
| **Universal Security & SOLID** | All files | OWASP Top 10, Hardcoded Secrets, Command Injection, Single Responsibility, Deep Nesting | `SEC-001` - `SEC-003`, `CLEAN-001` - `CLEAN-002` |

---

## 🔍 Framework-Specific Expert Guidelines

### 1. ⚛️ React & Next.js
- **`[REACT-001]` Stale Closures in Hooks**: Missing props or state in `useEffect`/`useCallback` dependencies causes subtle bugs where stale data is captured.
- **`[REACT-002]` Infinite Re-render Loops**: Calling state updaters directly in component bodies triggers an immediate crash.
- **`[REACT-003]` Index as Key**: Using array index as keys corrupts child state when list items are reordered or filtered.
- **`[NEXT-001]` Client-Server Boundary Leak**: Passing private API keys or DB objects to Client Components (`'use client'`) leaks server secrets to the browser.
- **`[NEXT-002]` Unauthenticated Server Actions**: Server Actions (`'use server'`) must verify session authentication and authorization like public API endpoints.

---

### 2. 💙 Flutter & Dart
- **`[FLUTTER-001]` Missing `mounted` Check**: Invoking `setState()` after an `await` without `if (!mounted) return;` crashes when users navigate away.
- **`[FLUTTER-002]` Controller Memory Leaks**: `TextEditingController`, `AnimationController`, and `StreamSubscription` must be disposed in `dispose()`.
- **`[FLUTTER-003]` `const` Widget Constructors**: Compile-time constant widgets short-circuit rebuilding unchanged subtrees, improving FPS.
- **`[FLUTTER-004]` Heavy Computations in `build()`**: Heavy parsing, sorting, or filtering inside `build()` blocks the UI thread and causes dropped frames.
- **`[FLUTTER-005]` Riverpod / Provider Over-Subscription**: Using `ref.watch(broadProvider)` instead of `.select()` triggers unnecessary whole-tree rebuilds.

---

### 3. 🐍 FastAPI & Django (Python)
- **`[FASTAPI-001]` Blocking Async Event Loop**: Calling `time.sleep()`, synchronous `requests.get()`, or blocking DB drivers inside `async def` endpoints stops all concurrent requests across the entire server.
- **`[FASTAPI-002]` Database Session Leaks**: Failing to use generator dependencies (`yield db` with `finally: db.close()`) rapidly exhausts connection pools.
- **`[DJANGO-001]` N+1 Database Queries**: Iterating over foreign key relationships without `select_related()` or `prefetch_related()` fires N separate SQL queries.

---

### 4. 🟩 Node.js, Express & NestJS
- **`[NODE-001]` Synchronous I/O in Handlers**: Calling `fs.readFileSync` or `execSync` halts Node's single-threaded event loop for all users.
- **`[NEST-001]` State Leak in Singleton Providers**: Saving request user data in singleton class properties leaks private user data across concurrent requests.

---

### 5. 🍃 Spring Boot (Java)
- **`[SPRING-001]` `@Transactional` Self-Invocation**: Calling a `@Transactional` method from within the same class bypasses Spring AOP proxying, causing transactions to never start.

---

### 6. 🐘 Laravel (PHP)
- **`[LARAVEL-001]` Eloquent N+1 Query**: Accessing relations in loops without `with()` causes severe database thrashing.
- **`[LARAVEL-002]` Mass Assignment Vulnerability**: Calling `User::create($request->all())` allows attackers to set administrative or sensitive fields.
