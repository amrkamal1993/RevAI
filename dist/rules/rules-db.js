export const CODING_RULES = [
    // ==========================================
    // JAVASCRIPT / TYPESCRIPT
    // ==========================================
    {
        id: 'TS-001',
        language: 'typescript',
        category: 'maintainability',
        severity: 'major',
        name: 'Avoid "any" Type',
        description: 'Using "any" disables all type safety and defeats the purpose of TypeScript. Prefer unknown, generics, or precise interfaces.',
        badExample: 'function parse(data: any) { return data.user.id; }',
        goodExample: 'function parse<T>(data: unknown): T { ... }'
    },
    {
        id: 'TS-002',
        language: 'javascript',
        category: 'reliability',
        severity: 'critical',
        name: 'Unhandled Promise Rejection',
        description: 'Async functions and Promises must have proper try/catch blocks or .catch() handlers to prevent silent failures or unhandled rejections.',
        badExample: 'async function fetchData() { const res = await api.get(); return res.data; }',
        goodExample: 'async function fetchData() { try { const res = await api.get(); return res.data; } catch (err) { logger.error(err); throw err; } }'
    },
    {
        id: 'TS-003',
        language: 'javascript',
        category: 'performance',
        severity: 'major',
        name: 'Memory Leak via Uncleaned Listeners / Timers',
        description: 'Event listeners, setInterval, and subscriptions must be removed/cleared when components unmount or objects are disposed.',
        badExample: 'useEffect(() => { window.addEventListener("resize", onResize); }, []);',
        goodExample: 'useEffect(() => { window.addEventListener("resize", onResize); return () => window.removeEventListener("resize", onResize); }, []);'
    },
    {
        id: 'TS-004',
        language: 'javascript',
        category: 'security',
        severity: 'critical',
        name: 'XSS Injection via innerHTML / dangerouslySetInnerHTML',
        description: 'Directly injecting unsanitized HTML creates dangerous Cross-Site Scripting (XSS) vulnerabilities. Use textContent or DOMPurify.',
        badExample: 'element.innerHTML = userComment;',
        goodExample: 'element.textContent = userComment;'
    },
    {
        id: 'TS-005',
        language: 'javascript',
        category: 'reliability',
        severity: 'minor',
        name: 'Loose Equality Operator',
        description: 'Using "==" or "!=" causes unexpected type coercion. Always use strict equality "===" and "!==".',
        badExample: 'if (status == 0) { ... }',
        goodExample: 'if (status === 0) { ... }'
    },
    {
        id: 'TS-006',
        language: 'typescript',
        category: 'performance',
        severity: 'major',
        name: 'Missing React Hook Dependencies',
        description: 'Omitting reactive values from the dependency array of useEffect, useMemo, or useCallback leads to stale closures and bugs.',
        badExample: 'useEffect(() => { loadUser(userId); }, []);',
        goodExample: 'useEffect(() => { loadUser(userId); }, [userId, loadUser]);'
    },
    // ==========================================
    // DART / FLUTTER
    // ==========================================
    {
        id: 'FLUTTER-001',
        language: 'dart',
        category: 'reliability',
        severity: 'critical',
        name: 'Missing "mounted" Check After Async Gap',
        description: 'Calling setState() or using BuildContext across an asynchronous gap without verifying "if (!mounted) return;" causes crashes if the State object was disposed.',
        badExample: 'await api.fetchData(); setState(() { data = result; });',
        goodExample: 'await api.fetchData(); if (!mounted) return; setState(() { data = result; });'
    },
    {
        id: 'FLUTTER-002',
        language: 'dart',
        category: 'performance',
        severity: 'major',
        name: 'Undisposed Controllers or Subscriptions',
        description: 'TextEditingController, AnimationController, ScrollController, and StreamSubscription must be explicitly disposed in the dispose() lifecycle method to prevent memory leaks.',
        badExample: 'class _MyState extends State<MyWidget> { final _controller = TextEditingController(); }',
        goodExample: '@override void dispose() { _controller.dispose(); super.dispose(); }'
    },
    {
        id: 'FLUTTER-003',
        language: 'dart',
        category: 'performance',
        severity: 'minor',
        name: 'Missing "const" Constructor on Static Widgets',
        description: 'Using "const" constructors allows Flutter to short-circuit rebuilding unchanged widget subtrees, significantly reducing garbage collection and UI jank.',
        badExample: 'return Container(padding: EdgeInsets.all(16), child: Text("Hello"));',
        goodExample: 'return const Container(padding: EdgeInsets.all(16), child: Text("Hello"));'
    },
    {
        id: 'FLUTTER-004',
        language: 'dart',
        category: 'performance',
        severity: 'major',
        name: 'Heavy Computation Inside build() Method',
        description: 'The build() method is invoked frequently during animations and transitions. Heavy computations, JSON parsing, or network requests inside build() freeze the UI thread.',
        badExample: 'Widget build(BuildContext context) { final sorted = sortMillionItems(data); return ListView(...); }',
        goodExample: 'Perform heavy calculation in initState, compute isolate, or state manager, not inside build().'
    },
    // ==========================================
    // PYTHON
    // ==========================================
    {
        id: 'PY-001',
        language: 'python',
        category: 'reliability',
        severity: 'critical',
        name: 'Mutable Default Function Argument',
        description: 'Default arguments are evaluated once at function definition time. Using a mutable default (e.g., list or dict) shares state across all calls.',
        badExample: 'def append_item(val, items=[]): items.append(val); return items',
        goodExample: 'def append_item(val, items=None): if items is None: items = []; items.append(val); return items'
    },
    {
        id: 'PY-002',
        language: 'python',
        category: 'reliability',
        severity: 'major',
        name: 'Bare "except:" Clause',
        description: 'A bare except catches SystemExit, KeyboardInterrupt, and MemoryError, making it difficult to interrupt the process and masking critical bugs. Always catch specific exceptions.',
        badExample: 'try: do_work() except: pass',
        goodExample: 'try: do_work() except (ValueError, KeyError) as e: logger.error(f"Failed: {e}")'
    },
    {
        id: 'PY-003',
        language: 'python',
        category: 'maintainability',
        severity: 'major',
        name: 'Unclosed Resource / Not Using Context Manager',
        description: 'Files, network sockets, and database connections must be opened using "with" statements to guarantee closure even on exceptions.',
        badExample: 'f = open("data.txt"); data = f.read(); f.close()',
        goodExample: 'with open("data.txt") as f: data = f.read()'
    },
    {
        id: 'PY-004',
        language: 'python',
        category: 'security',
        severity: 'critical',
        name: 'SQL String Formatting / Injection',
        description: 'Formatting SQL queries with f-strings or % exposes the application to SQL injection. Always use parameterized queries.',
        badExample: 'cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")',
        goodExample: 'cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))'
    },
    // ==========================================
    // GOLANG
    // ==========================================
    {
        id: 'GO-001',
        language: 'go',
        category: 'reliability',
        severity: 'critical',
        name: 'Ignored Error Return Value',
        description: 'Ignoring errors in Go leads to undefined behavior and unexpected panics. Always check "if err != nil" or handle explicitly.',
        badExample: '_ = json.Unmarshal(data, &obj)',
        goodExample: 'if err := json.Unmarshal(data, &obj); err != nil { return fmt.Errorf("decode error: %w", err) }'
    },
    {
        id: 'GO-002',
        language: 'go',
        category: 'performance',
        severity: 'critical',
        name: 'Goroutine Leak via Unbuffered Channel / Missing Context',
        description: 'Spawning goroutines without a cancellation signal or reading from an unbuffered channel when no receiver exists permanently leaks goroutines.',
        badExample: 'go func() { ch <- compute() }() // If nobody reads ch, this leaks forever',
        goodExample: 'Use buffered channel of size 1 or select with ctx.Done(): select { case ch <- res: case <-ctx.Done(): return }'
    },
    {
        id: 'GO-003',
        language: 'go',
        category: 'performance',
        severity: 'major',
        name: 'Defer in Long or Infinite Loops',
        description: 'Deferred calls execute only when the enclosing function returns, not when the loop iteration ends. This exhausts file descriptors or memory.',
        badExample: 'for _, file := range files { f, _ := os.Open(file); defer f.Close(); }',
        goodExample: 'Wrap body in an anonymous function: for _, file := range files { func() { f, _ := os.Open(file); defer f.Close(); ... }() }'
    },
    // ==========================================
    // JAVA / KOTLIN
    // ==========================================
    {
        id: 'JAVA-001',
        language: 'java',
        category: 'reliability',
        severity: 'critical',
        name: 'Swallowed Exception Block',
        description: 'Empty catch blocks silence critical system errors and make debugging in production nearly impossible.',
        badExample: 'try { doSomething(); } catch (Exception e) {}',
        goodExample: 'try { doSomething(); } catch (Exception e) { logger.error("Operation failed", e); throw new ServiceException(e); }'
    },
    {
        id: 'JAVA-002',
        language: 'java',
        category: 'reliability',
        severity: 'major',
        name: 'Potential NullPointerException',
        description: 'Accessing methods on objects without null checks or Optional chaining causes NullPointerExceptions. Use Optional or Objects.requireNonNull().',
        badExample: 'return user.getAddress().getCity();',
        goodExample: 'return Optional.ofNullable(user).map(User::getAddress).map(Address::getCity).orElse("Unknown");'
    },
    // ==========================================
    // PHP
    // ==========================================
    {
        id: 'PHP-001',
        language: 'php',
        category: 'security',
        severity: 'critical',
        name: 'SQL Injection via Unprepared Queries',
        description: 'Concatenating user inputs into PDO or mysqli queries enables full database compromise. Use prepared statements with parameters.',
        badExample: '$db->query("SELECT * FROM users WHERE email = \'" . $_POST["email"] . "\'");',
        goodExample: '$stmt = $db->prepare("SELECT * FROM users WHERE email = :email"); $stmt->execute(["email" => $_POST["email"]]);'
    },
    // ==========================================
    // RUST
    // ==========================================
    {
        id: 'RUST-001',
        language: 'rust',
        category: 'reliability',
        severity: 'major',
        name: 'Using .unwrap() in Production Code',
        description: 'Calling .unwrap() panics and crashes the application on None or Err. Use pattern matching, if-let, or the ? operator.',
        badExample: 'let config = read_config().unwrap();',
        goodExample: 'let config = read_config().map_err(|e| AppError::Config(e))?;'
    },
    // ==========================================
    // UNIVERSAL SECURITY (OWASP) & SECRETS
    // ==========================================
    {
        id: 'SEC-001',
        language: 'universal',
        category: 'security',
        severity: 'critical',
        name: 'Hardcoded Secret / API Key / Password',
        description: 'Never commit credentials, private keys, JWT secrets, or API tokens into source code. Always use environment variables.',
        badExample: 'const STRIPE_SECRET = "sk_live_51Abc123...";',
        goodExample: 'const STRIPE_SECRET = process.env.STRIPE_SECRET;'
    },
    {
        id: 'SEC-002',
        language: 'universal',
        category: 'security',
        severity: 'critical',
        name: 'Command Injection / Shell Execution',
        description: 'Passing unsanitized user input to exec, system, or child_process commands allows arbitrary remote code execution on the server.',
        badExample: 'exec(`ping -c 1 ${userIp}`);',
        goodExample: 'Use sanitized argument arrays: execFile("ping", ["-c", "1", sanitizedIp]);'
    },
    {
        id: 'SEC-003',
        language: 'universal',
        category: 'security',
        severity: 'critical',
        name: 'Broken Access Control / Missing Authorization',
        description: 'Endpoints modifying data must verify that the authenticated user owns or has explicit permission to manipulate the requested resource.',
        badExample: 'DELETE /api/orders/:id -> directly deletes order with id without verifying ownership',
        goodExample: 'Verify user context: if (order.userId !== currentUser.id && !currentUser.isAdmin) throw Forbidden();'
    },
    // ==========================================
    // CLEAN CODE & SOLID
    // ==========================================
    {
        id: 'CLEAN-001',
        language: 'universal',
        category: 'maintainability',
        severity: 'minor',
        name: 'High Cognitive Complexity / Deep Nesting',
        description: 'Nesting conditional statements more than 3-4 levels deep creates difficult-to-maintain code and edge cases. Apply early returns (guard clauses).',
        badExample: 'if (a) { if (b) { if (c) { doWork(); } } }',
        goodExample: 'if (!a || !b || !c) return; doWork();'
    },
    {
        id: 'CLEAN-002',
        language: 'universal',
        category: 'maintainability',
        severity: 'minor',
        name: 'Single Responsibility Principle Violation',
        description: 'Functions or classes performing multiple unrelated tasks (e.g., fetching data, validating, formatting, and sending emails in one function) should be separated into focused modules.',
        badExample: 'A single 200-line function that parses HTTP requests, queries database, calculates tax, formats PDF, and sends SMTP email.',
        goodExample: 'Separate into RequestValidator, TaxCalculator, InvoicePdfService, and EmailNotifier.'
    }
];
export function getRulesForLanguages(languages) {
    const normalizedLangs = languages.map(l => l.toLowerCase());
    return CODING_RULES.filter(rule => {
        if (rule.language === 'universal')
            return true;
        return normalizedLangs.some(lang => {
            if (rule.language === 'typescript' && (lang === 'ts' || lang === 'tsx' || lang === 'typescript'))
                return true;
            if (rule.language === 'javascript' && (lang === 'js' || lang === 'jsx' || lang === 'javascript' || lang === 'ts' || lang === 'typescript'))
                return true;
            if (rule.language === 'dart' && (lang === 'dart' || lang === 'flutter'))
                return true;
            if (rule.language === 'python' && (lang === 'py' || lang === 'python'))
                return true;
            if (rule.language === 'go' && (lang === 'go' || lang === 'golang'))
                return true;
            if (rule.language === 'java' && (lang === 'java' || lang === 'kotlin' || lang === 'kt'))
                return true;
            if (rule.language === 'php' && (lang === 'php'))
                return true;
            if (rule.language === 'rust' && (lang === 'rs' || lang === 'rust'))
                return true;
            return false;
        });
    });
}
