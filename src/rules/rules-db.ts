import { CodingRule } from '../types.js';

export const CODING_RULES: CodingRule[] = [
  // ==========================================
  // REACT & NEXT.JS (TYPESCRIPT / JAVASCRIPT)
  // ==========================================
  {
    id: 'REACT-001',
    language: 'react',
    category: 'reliability',
    severity: 'major',
    name: 'Stale Closure / Missing Hook Dependencies',
    description: 'Omitting state variables or props from the dependency array of useEffect, useMemo, or useCallback causes stale closures, where the hook references outdated values from previous renders.',
    badExample: 'useEffect(() => { fetchUserData(userId, filter); }, []); // ❌ Missing userId and filter',
    goodExample: 'useEffect(() => { fetchUserData(userId, filter); }, [userId, filter]);'
  },
  {
    id: 'REACT-002',
    language: 'react',
    category: 'performance',
    severity: 'critical',
    name: 'Unconditional State Update in Component Body',
    description: 'Calling setState directly in the render body of a component without useEffect or event handlers causes an immediate infinite re-render loop that crashes the browser tab.',
    badExample: 'function Profile({ user }) { setUserName(user.name); return <div>{user.name}</div>; }',
    goodExample: 'useEffect(() => { setUserName(user.name); }, [user.name]);'
  },
  {
    id: 'REACT-003',
    language: 'react',
    category: 'reliability',
    severity: 'minor',
    name: 'Index as Key in Dynamic Lists',
    description: 'Using array index as the "key" prop in dynamic lists causes rendering bugs, component state corruption, and broken animation transitions when items are reordered, inserted, or filtered.',
    badExample: '{items.map((item, index) => <TodoItem key={index} data={item} />)}',
    goodExample: '{items.map((item) => <TodoItem key={item.id} data={item} />)}'
  },
  {
    id: 'NEXT-001',
    language: 'nextjs',
    category: 'security',
    severity: 'critical',
    name: 'Secret Leak Across Client-Server Boundary',
    description: 'Passing private environment variables, database clients, or secret API keys into Client Components (\'use client\') exposes sensitive server credentials in the client-side JavaScript bundle.',
    badExample: '// In Server Component:\n<ClientUserCard user={user} privateApiKey={process.env.INTERNAL_KEY} />',
    goodExample: '// Strip server secrets before passing props to Client Component:\n<ClientUserCard user={{ id: user.id, name: user.name }} />'
  },
  {
    id: 'NEXT-002',
    language: 'nextjs',
    category: 'security',
    severity: 'critical',
    name: 'Missing Authentication / CSRF Check in Server Actions',
    description: 'Next.js Server Actions (\'use server\') act as public POST endpoints. They MUST independently verify user authentication and resource authorization before executing mutations.',
    badExample: '\'use server\';\nexport async function deleteOrder(orderId: string) { await db.order.delete({ where: { id: orderId } }); }',
    goodExample: '\'use server\';\nexport async function deleteOrder(orderId: string) {\n  const session = await auth();\n  if (!session?.user?.id) throw new UnauthorizedError();\n  await db.order.delete({ where: { id: orderId, userId: session.user.id } });\n}'
  },

  // ==========================================
  // JAVASCRIPT / TYPESCRIPT CORE
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

  // ==========================================
  // FLUTTER & DART
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
  {
    id: 'FLUTTER-005',
    language: 'dart',
    category: 'performance',
    severity: 'major',
    name: 'Provider / Riverpod Over-Subscription',
    description: 'Calling context.watch() or ref.watch() on an entire broad state object when only a single property is needed causes the entire widget tree to rebuild on every unrelated state update.',
    badExample: 'final state = ref.watch(appStateProvider); // ❌ Rebuilds on ANY change in appState',
    goodExample: 'final userName = ref.watch(appStateProvider.select((s) => s.user.name)); // ✅ Rebuilds only when name changes'
  },

  // ==========================================
  // FASTAPI, DJANGO & PYTHON WEB
  // ==========================================
  {
    id: 'FASTAPI-001',
    language: 'fastapi',
    category: 'performance',
    severity: 'critical',
    name: 'Blocking Synchronous I/O in Async Endpoint',
    description: 'Calling synchronous blocking operations (such as time.sleep(), requests.get(), or blocking DB drivers) inside an "async def" route blocks FastAPI\'s entire single event loop thread, preventing all concurrent requests.',
    badExample: '@app.get("/items")\nasync def get_items():\n    time.sleep(2) # ❌ Blocks entire async event loop!\n    res = requests.get("https://api.com") # ❌ Blocking I/O\n    return res.json()',
    goodExample: '@app.get("/items")\nasync def get_items():\n    await asyncio.sleep(2) # ✅ Non-blocking\n    async with httpx.AsyncClient() as client:\n        res = await client.get("https://api.com")\n    return res.json()'
  },
  {
    id: 'FASTAPI-002',
    language: 'fastapi',
    category: 'reliability',
    severity: 'critical',
    name: 'Database Session Leak in Dependency Injection',
    description: 'Database sessions injected via FastAPI Depends must properly close connections using a generator with try/finally to prevent connection pool exhaustion.',
    badExample: 'def get_db():\n    db = SessionLocal()\n    return db # ❌ Never closed! Leaks database connections',
    goodExample: 'def get_db():\n    db = SessionLocal()\n    try:\n        yield db\n    finally:\n        db.close()'
  },
  {
    id: 'DJANGO-001',
    language: 'django',
    category: 'performance',
    severity: 'major',
    name: 'N+1 Query Problem in ORM',
    description: 'Traversing foreign key or many-to-many relationships in a loop without select_related() or prefetch_related() executes one new SQL query per row (N+1 queries), destroying database performance.',
    badExample: 'orders = Order.objects.all()\nfor o in orders:\n    print(o.customer.name) # ❌ Triggers 1 SQL query per order!',
    goodExample: 'orders = Order.objects.select_related("customer").all()\nfor o in orders:\n    print(o.customer.name) # ✅ Single SQL JOIN query'
  },
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
  // NODE.JS / EXPRESS / NESTJS
  // ==========================================
  {
    id: 'NODE-001',
    language: 'nodejs',
    category: 'performance',
    severity: 'critical',
    name: 'Synchronous I/O in Request Handler',
    description: 'Calling fs.readFileSync, execSync, or synchronous crypto functions inside request handlers halts the Node.js event loop, preventing all concurrent HTTP requests from processing.',
    badExample: 'app.get("/config", (req, res) => { const data = fs.readFileSync("config.json"); res.send(data); });',
    goodExample: 'app.get("/config", async (req, res) => { const data = await fs.promises.readFile("config.json"); res.send(data); });'
  },
  {
    id: 'NEST-001',
    language: 'nestjs',
    category: 'security',
    severity: 'critical',
    name: 'User State Leaked in Singleton Service',
    description: 'NestJS injectable providers are Singletons by default. Storing request-scoped state (e.g. current user, auth tokens) in class properties leaks user data across concurrent user requests.',
    badExample: '@Injectable()\nexport class AuthService {\n  private currentUser: User; // ❌ Leaks state across all requests!\n}',
    goodExample: 'Pass the user context as a parameter to methods, or use @Inject(REQUEST) with Scope.REQUEST if strictly necessary.'
  },

  // ==========================================
  // GOLANG (GIN / FIBER / STD)
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
    id: 'GO-004',
    language: 'go',
    category: 'reliability',
    severity: 'major',
    name: 'Unclosed HTTP Response Body',
    description: 'Failing to close resp.Body prevents TCP connection reuse and exhausts open file descriptors and socket pools.',
    badExample: 'resp, err := http.Get(url)\nif err != nil { return err }\nbody, _ := io.ReadAll(resp.Body) // ❌ Missing defer resp.Body.Close()',
    goodExample: 'resp, err := http.Get(url)\nif err != nil { return err }\ndefer resp.Body.Close()\nbody, err := io.ReadAll(resp.Body)'
  },

  // ==========================================
  // SPRING BOOT & JAVA / KOTLIN
  // ==========================================
  {
    id: 'SPRING-001',
    language: 'spring',
    category: 'reliability',
    severity: 'critical',
    name: '@Transactional Self-Invocation Bypass',
    description: 'Calling a @Transactional method from another method within the same class bypasses the Spring AOP proxy. The transaction will NOT be initiated, leaving mutations non-atomic.',
    badExample: 'public void process() { this.saveInTransaction(); } // ❌ Bypasses proxy\n@Transactional public void saveInTransaction() { ... }',
    goodExample: 'Inject self-reference or extract transactional method to a separate service class.'
  },
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

  // ==========================================
  // LARAVEL & PHP
  // ==========================================
  {
    id: 'LARAVEL-001',
    language: 'laravel',
    category: 'performance',
    severity: 'major',
    name: 'Eloquent N+1 Query Problem',
    description: 'Accessing Eloquent model relations inside a loop without eager loading (using with()) executes N additional database queries.',
    badExample: '$books = Book::all(); foreach ($books as $b) { echo $b->author->name; } // ❌ N+1 queries',
    goodExample: '$books = Book::with("author")->get(); foreach ($books as $b) { echo $b->author->name; } // ✅ 2 queries only'
  },
  {
    id: 'LARAVEL-002',
    language: 'laravel',
    category: 'security',
    severity: 'critical',
    name: 'Mass Assignment Vulnerability',
    description: 'Using un-guarded models or blindly passing $request->all() to create() or update() enables malicious users to overwrite sensitive fields such as is_admin or balance.',
    badExample: 'User::create($request->all()); // ❌ Allows user to submit is_admin=1',
    goodExample: 'User::create($request->validated()); // ✅ Only uses validated attributes'
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

export function getRulesForLanguages(languages: string[]): CodingRule[] {
  const normalizedLangs = languages.map(l => l.toLowerCase());
  return CODING_RULES.filter(rule => {
    if (rule.language === 'universal') return true;
    return normalizedLangs.some(lang => {
      // TypeScript / JavaScript / React / Next.js / Node
      if ((rule.language === 'typescript' || rule.language === 'react' || rule.language === 'nextjs' || rule.language === 'nodejs') &&
          (lang === 'ts' || lang === 'tsx' || lang === 'typescript' || lang === 'js' || lang === 'jsx' || lang === 'javascript')) {
        return true;
      }
      if (rule.language === 'javascript' && (lang === 'js' || lang === 'jsx' || lang === 'javascript' || lang === 'ts' || lang === 'tsx')) return true;

      // Dart / Flutter
      if (rule.language === 'dart' && (lang === 'dart' || lang === 'flutter')) return true;

      // Python / FastAPI / Django
      if ((rule.language === 'python' || rule.language === 'fastapi' || rule.language === 'django') &&
          (lang === 'py' || lang === 'python')) {
        return true;
      }

      // Go / Golang
      if (rule.language === 'go' && (lang === 'go' || lang === 'golang')) return true;

      // Java / Kotlin / Spring
      if ((rule.language === 'java' || rule.language === 'spring') &&
          (lang === 'java' || lang === 'kotlin' || lang === 'kt')) {
        return true;
      }

      // PHP / Laravel
      if ((rule.language === 'php' || rule.language === 'laravel') && (lang === 'php')) return true;

      // Rust
      if (rule.language === 'rust' && (lang === 'rs' || lang === 'rust')) return true;

      return false;
    });
  });
}
