## ADDED Requirements

### Requirement: Root file allowlist
The repository SHALL define and enforce an allowlist for files permitted at its root.

#### Scenario: Misplaced root artifact
- **WHEN** an unapproved log, temporary file, screenshot, or wrapper script appears at the repository root
- **THEN** the repository audit fails and reports the expected destination

### Requirement: Temporary output isolation
Logs, PIDs, download caches, image retry data, and QA scratch output SHALL be written below ignored `.cache` directories or the system temporary directory.

#### Scenario: Development command output
- **WHEN** a development or automation command produces temporary artifacts
- **THEN** no new temporary file is created at the repository root or in generated site output

### Requirement: Automated repository audit
The project SHALL expose `npm run audit:repo` and SHALL run it as part of build and deployment validation.

#### Scenario: Polluted tracked or generated files
- **WHEN** tracked files or `public` contain a forbidden backup, log, cache, or PID pattern
- **THEN** validation exits non-zero with the offending paths

### Requirement: Major iteration documentation
New capabilities, cross-page redesigns, dependency or data changes, and workflow changes SHALL use an OpenSpec change and SHALL produce an execution report before completion.

#### Scenario: Major change completes
- **WHEN** implementation and verification finish
- **THEN** the active change contains completed tasks and an execution report with process, results, verification, deviations, remaining work, and rollback guidance

#### Scenario: Local bug fix
- **WHEN** a change is a behavior-preserving local fix with no interface, data, dependency, or workflow impact
- **THEN** OpenSpec documentation is not required
