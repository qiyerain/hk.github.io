## ADDED Requirements

### Requirement: Reproducible container delivery
The project SHALL build and test a Java 26 Spring Boot image in GitHub Actions and publish it to GHCR.

#### Scenario: Successful push
- **WHEN** a change reaches the configured branch
- **THEN** Actions runs `./mvnw test`, builds a tagged image and publishes it without embedding secrets

#### Scenario: Failed test
- **WHEN** a test fails
- **THEN** the image is not published and the deployment job does not run

### Requirement: Safe server rollout
The server SHALL pull the selected image over SSH, run health checks and keep the previous image available for rollback.

#### Scenario: Healthy rollout
- **WHEN** the new container starts and `/actuator/health` is healthy
- **THEN** Compose keeps the new version running behind Nginx

#### Scenario: Unhealthy rollout
- **WHEN** health checks fail
- **THEN** deployment reports failure and does not route traffic to the unhealthy version
