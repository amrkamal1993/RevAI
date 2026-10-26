# 💙 Flutter & Dart Code Review Guide: Rules, Skills & Best Practices

RevAI comes preloaded with production-tested rules specifically tailored for **Flutter & Dart**. Whether you are building mobile, web, or desktop applications, RevAI audits your code against common pitfalls, memory leaks, and performance bottlenecks.

---

## 🎯 Preloaded Flutter Rules in RevAI

### 1. `[FLUTTER-001]` Missing `mounted` Check Across Async Gaps
- **Severity**: 🔴 Critical
- **Category**: Reliability
- **Why it matters**: In Flutter, asynchronous operations (network calls, database queries, delayed futures) take time. If the user navigates back (`Navigator.pop()`) before the async call completes, the widget's `State` object is unmounted. Calling `setState()` on an unmounted state throws `FlutterError: setState() called after dispose()`, crashing the application in production.
- **Rule Violation**:
  ```dart
  Future<void> _login() async {
    setState(() => _loading = true);
    final user = await authService.login(email, password);
    // ❌ DANGEROUS: Widget might have unmounted during the network request!
    setState(() {
      _loading = false;
      _currentUser = user;
    });
  }
  ```
- **Recommended Solution**:
  ```dart
  Future<void> _login() async {
    setState(() => _loading = true);
    final user = await authService.login(email, password);
    // ✅ Safe guard clause:
    if (!mounted) return;
    setState(() {
      _loading = false;
      _currentUser = user;
    });
  }
  ```

---

### 2. `[FLUTTER-002]` Undisposed Controllers, Streams & Timers
- **Severity**: 🟠 Major
- **Category**: Performance & Memory
- **Why it matters**: `TextEditingController`, `AnimationController`, `ScrollController`, `PageController`, and `StreamSubscription` register listeners on native or event buses. If not disposed in the `dispose()` lifecycle method, they remain in memory permanently, causing memory leaks and degraded FPS over time.
- **Rule Violation**:
  ```dart
  class _SearchWidgetState extends State<SearchWidget> {
    final TextEditingController _searchCtrl = TextEditingController();
    late StreamSubscription _sub;
    // ❌ Missing dispose() method!
  }
  ```
- **Recommended Solution**:
  ```dart
  class _SearchWidgetState extends State<SearchWidget> {
    final TextEditingController _searchCtrl = TextEditingController();
    late StreamSubscription _sub;

    @override
    void dispose() {
      _searchCtrl.dispose();
      _sub.cancel();
      super.dispose();
    }
  }
  ```

---

### 3. `[FLUTTER-003]` Missing `const` Constructors on Static Widgets
- **Severity**: 🟡 Minor
- **Category**: Performance & Rendering
- **Why it matters**: The `const` keyword creates compile-time constant widget instances. When the parent widget rebuilds, Flutter detects that the `const` widget instance is identical and completely skips rebuilding that subtree, reducing CPU load and garbage collection overhead.
- **Rule Violation**:
  ```dart
  // ❌ Re-instantiates EdgeInsets and Text on every parent build:
  return Container(
    padding: EdgeInsets.all(16),
    child: Text("Welcome back!"),
  );
  ```
- **Recommended Solution**:
  ```dart
  // ✅ Reused in memory with zero rebuild overhead:
  return const Padding(
    padding: EdgeInsets.all(16),
    child: Text("Welcome back!"),
  );
  ```

---

### 4. `[FLUTTER-004]` Heavy Computations Inside `build()`
- **Severity**: 🟠 Major
- **Category**: Performance
- **Why it matters**: The Flutter engine calls `build()` up to 60 or 120 times per second during scrolling, transitions, and animations. Running sorting algorithms, heavy regex parsing, or network requests inside `build()` blocks the UI thread, causing severe dropped frames (jank).
- **Rule Violation**:
  ```dart
  @override
  Widget build(BuildContext context) {
    // ❌ Heavy loop running 60 times/sec:
    final filteredList = items.where((e) => expensiveRegex.hasMatch(e)).toList()..sort();
    return ListView.builder(...);
  }
  ```
- **Recommended Solution**:
  Compute outside the build cycle (in `initState`, via `compute(isolate)`, or inside your state management layer like Cubit/BLoC/Notifier).

---

## 💡 Flutter Architectural Best Practices

### State Management Guidelines
1. **Separation of Concerns**: Never put business logic, API calls, or SQL queries inside Flutter UI Widgets.
2. **Provider / Riverpod**: Avoid watching entire complex state objects when you only need a single property (`ref.watch(userProvider.select((u) => u.name))`).
3. **BLoC / Cubit**: Keep states immutable (`freezed` or `Equatable`) to ensure predictable change detection.

### Effective Dart Rules Audited by RevAI
- Prefer using `ListView.builder` over `ListView(children: [...])` for long or infinite lists.
- Avoid raw string literals for routes or localization keys.
- Avoid passing raw `BuildContext` across deep asynchronous calls without checking `context.mounted`.
