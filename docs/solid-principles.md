# 🏛️ SOLID Principles & Clean Code Guide in RevAI

RevAI evaluates pull requests and code changes against the **SOLID Principles** and modern Clean Code guidelines to ensure long-term maintainability, readability, and testability.

---

## 📐 The SOLID Principles Breakdown

### 1. Single Responsibility Principle (SRP)
> *"A class or function should have one, and only one, reason to change."*

- **The Problem**: Writing massive "God Objects" or giant 300-line functions that fetch data, validate inputs, update databases, and format emails all in one place.
- **RevAI Rule**: `[CLEAN-002]`
- **Code Smell**:
  ```ts
  // ❌ Violates SRP: Handles routing, validation, hashing, DB persistence, and email sending
  async function registerUser(req, res) {
    if (!req.body.email.includes('@')) throw Error('Invalid');
    const hash = await bcrypt.hash(req.body.password, 10);
    const user = await db.users.insert({ email: req.body.email, hash });
    const transport = nodemailer.createTransport(...);
    await transport.sendMail({ to: user.email, subject: 'Welcome' });
    res.json({ success: true });
  }
  ```
- **Refactored**:
  ```ts
  // ✅ Clean: Composed of focused, reusable services
  async function registerUser(req: RegisterRequest): Promise<UserResponse> {
    userValidator.validate(req);
    const user = await userService.createUser(req);
    await notificationService.sendWelcomeEmail(user);
    return user;
  }
  ```

---

### 2. Open / Closed Principle (OCP)
> *"Software entities should be open for extension, but closed for modification."*

- **The Problem**: Using large chains of `if/else` or `switch` statements checking type enums. Every time a new type is added, the original function must be modified, increasing the risk of regressions.
- **Refactored Strategy**: Use Strategy pattern, polymorphism, or dictionary handler maps.

---

### 3. Liskov Substitution Principle (LSP)
> *"Subtypes must be substitutable for their base types without altering system correctness."*

- **The Problem**: A child class throwing `NotImplementedException` or changing the expected return type of an inherited method.

---

### 4. Interface Segregation Principle (ISP)
> *"Clients should not be forced to depend upon interfaces that they do not use."*

- **The Problem**: Mega-interfaces with 30 methods where a consumer only needs 2.
- **Refactored Strategy**: Break large interfaces down into lean, focused contracts (`ReadableStream`, `WritableStream`).

---

### 5. Dependency Inversion Principle (DIP)
> *"High-level modules should not depend on low-level modules. Both should depend on abstractions."*

- **The Problem**: Hardcoding direct database clients (e.g., `new MySQLClient()`) inside core business domain services.
- **Refactored Strategy**: Inject an interface or repository contract (`constructor(private userRepo: UserRepository)`).

---

## 🧠 Cognitive Complexity & Clean Code Rules

### `[CLEAN-001]` Avoid Deep Nesting (Guard Clauses)
- Keep nesting depth under 3 levels.
- Apply **Early Returns** (Guard Clauses) instead of wrapping entire function bodies in nested `if` statements.

```ts
// ❌ Hard to read (Deep nesting)
function processOrder(order) {
  if (order != null) {
    if (order.isValid) {
      if (order.isPaid) {
        ship(order);
      }
    }
  }
}

// ✅ Clean & readable (Guard clauses)
function processOrder(order) {
  if (!order || !order.isValid || !order.isPaid) return;
  ship(order);
}
```
