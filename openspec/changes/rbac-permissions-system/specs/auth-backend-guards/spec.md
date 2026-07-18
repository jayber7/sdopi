## ADDED Requirements

### Requirement: Permission Guard Decorator
The system SHALL provide a NestJS decorator `@RequirePermission(resource, action)` that protects controller endpoints.

#### Scenario: Guard allows access with correct permission
- **GIVEN** a controller endpoint decorated with `@RequirePermission('planillas', 'create')`
- **WHEN** a user with `planillas:create` permission sends a request to that endpoint
- **THEN** the request proceeds to the controller handler

#### Scenario: Guard denies access without permission
- **GIVEN** a controller endpoint decorated with `@RequirePermission('planillas', 'create')`
- **WHEN** a user without `planillas:create` permission sends a request
- **THEN** a 403 Forbidden error is returned
- **AND** the response includes a message indicating insufficient permissions

#### Scenario: Guard denies access for unauthenticated user
- **GIVEN** a controller endpoint decorated with `@RequirePermission('planillas', 'create')`
- **WHEN** an unauthenticated request is sent
- **THEN** a 401 Unauthorized error is returned before the permission check

### Requirement: Role-Based Permission Resolution
The system SHALL resolve effective permissions by combining role-based permissions with user-specific overrides.

#### Scenario: User inherits role permissions
- **GIVEN** a user assigned to role "operador" which has `planillas:create` permission
- **WHEN** the system checks if the user has `planillas:create`
- **THEN** the check returns true

#### Scenario: User override extends permissions
- **GIVEN** a user assigned to role "consulta" (no `planillas:create`)
- **GIVEN** the user has an explicit override for `planillas:create`
- **WHEN** the system checks if the user has `planillas:create`
- **THEN** the check returns true

#### Scenario: User override restricts permissions
- **GIVEN** a user assigned to role "admin" (full access)
- **GIVEN** the user has an explicit negative override removing `usuarios:delete`
- **WHEN** the system checks if the user has `usuarios:delete`
- **THEN** the check returns false

### Requirement: Auth Module Integration
The system SHALL integrate the permission guard into the existing AuthModule, reading permissions from the JWT payload or fetching from a cache on each request.

#### Scenario: Permissions in JWT
- **GIVEN** a logged-in user with resolved permissions
- **WHEN** the user authenticates
- **THEN** the JWT payload includes an array of effective permission strings (e.g., ["proyectos:read", "planillas:create"])
- **AND** the guard reads permissions from the JWT without additional database queries

#### Scenario: Permission cache TTL
- **GIVEN** a logged-in user whose permissions changed
- **WHEN** the user makes an API request after the cache TTL expires
- **THEN** the new permissions are loaded into the JWT
- **AND** the old permissions are no longer valid
