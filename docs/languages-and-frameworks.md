# 🌐 Supported Languages & Frameworks Matrix

RevAI automatically detects the languages present in your Git diff and selects the appropriate rule sets before auditing with Google Gemini.

---

## 📊 Language Support Overview

| Language / Framework | Extensions | Key Audit Areas | Preloaded Rules |
| :--- | :--- | :--- | :--- |
| **Dart / Flutter** | `.dart` | Widget rebuilding, controller leaks, async mounted checks, isolates | `FLUTTER-001` - `FLUTTER-004` |
| **TypeScript** | `.ts`, `.tsx` | Strict types, avoiding `any`, hook dependencies, unhandled promises | `TS-001` - `TS-006` |
| **JavaScript** | `.js`, `.jsx`, `.mjs` | DOM XSS (`innerHTML`), loose equality (`==`), event listener leaks | `TS-002` - `TS-005` |
| **Python** | `.py` | PEP 8, mutable defaults, SQL injection, resource closing (`with`) | `PY-001` - `PY-004` |
| **Go (Golang)** | `.go` | Error return handling, Goroutine leaks, slice races, defer in loops | `GO-001` - `GO-003` |
| **Java & Kotlin** | `.java`, `.kt` | Null safety, exception swallowing, thread synchronization | `JAVA-001` - `JAVA-002` |
| **PHP** | `.php` | Prepared statements, modern PHP 8 type safety, input sanitization | `PHP-001` |
| **Rust** | `.rs` | `.unwrap()` in production, excessive cloning, unsafe blocks | `RUST-001` |
| **Cross-Cutting / All** | All files | OWASP Top 10, Hardcoded Secrets, Cognitive Complexity, SOLID | `SEC-001` - `CLEAN-002` |

---

## 🔍 Language-Specific Deep Dives

### 1. TypeScript & JavaScript
- **Avoid `any` (`TS-001`)**: Enforces explicit types or generics to prevent runtime type errors.
- **Unhandled Promises (`TS-002`)**: Detects missing `try/catch` or `.catch()` on async executions.
- **XSS Vulnerabilities (`TS-004`)**: Flags unsanitized usage of `innerHTML` or `dangerouslySetInnerHTML`.
- **React Hook Dependencies (`TS-006`)**: Verifies that `useEffect` and `useCallback` dependency arrays contain all referenced state/prop values.

### 2. Python
- **Mutable Default Arguments (`PY-001`)**: Identifies functions defined like `def add(item, bucket=[])`, which mutate state across calls.
- **Bare `except:` (`PY-002`)**: Catches broad exception clauses that inadvertently catch `KeyboardInterrupt` or `SystemExit`.
- **Resource Management (`PY-003`)**: Flags unmanaged file or network descriptors not wrapped in `with` context managers.
- **SQL Injection (`PY-004`)**: Detects string formatting (`f"SELECT ... {id}"`) instead of parameterized queries.

### 3. Go (Golang)
- **Ignored Errors (`GO-001`)**: Flags blank identifier error discards (`_ = doSomething()`).
- **Goroutine Leaks (`GO-002`)**: Detects unbuffered channel sends with no cancellation context or active listeners.
- **Defer in Long Loops (`GO-003`)**: Warns when `defer` is called inside iterative loops, which delays cleanup until the caller returns.
