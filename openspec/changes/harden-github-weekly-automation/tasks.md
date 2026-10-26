## 1. Automation Contract

- [x] 1.1 Update automation `github` in place with the staged preflight, canonical directory, independent channel outcomes, and guaranteed final summary.
- [x] 1.2 Add explicit WeChat `draft/add` versus `draft/update` idempotency and remote `draft/get` verification rules.
- [x] 1.3 Add the GitHub weekly WeChat whole-document zero-`ul`/zero-`li` rendering gate.

## 2. Persistence And Verification

- [x] 2.1 Record the optimized fast path and recovery rules in automation memory.
- [x] 2.2 Read back the automation and verify schedule, model, environment, target, working directory, and active status are unchanged.
- [x] 2.3 Run OpenSpec status, repository audit, and diff checks; add an execution report with rollback guidance.
