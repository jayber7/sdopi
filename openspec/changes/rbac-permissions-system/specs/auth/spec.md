## MODIFIED Requirements

### Requirement: Role-Based Access Control
The system SHALL restrict access to resources based on user roles AND granular permissions. For backwards compatibility, the `role` field on the User model is mapped to a `Role` record. The system resolves effective permissions by merging the role's permissions with any user-specific overrides.

#### Scenario: Admin full access
- **GIVEN** a user assigned to the "admin" role which has all permissions
- **WHEN** the user accesses any resource protected by `@RequirePermission()`
- **THEN** full access is granted

#### Scenario: Operador access
- **GIVEN** a user with role "operador" (permissions: proyectos CRUD, planillas CRUD+enviar, evidencias CRUD, reportes read)
- **WHEN** the user creates or edits planillas
- **THEN** access is granted
- **WHEN** the user manages other users
- **THEN** access is denied

#### Scenario: Consulta access
- **GIVEN** a user with role "consulta" (permissions: proyectos read, reportes read)
- **WHEN** the user views dashboards and reports
- **THEN** access is granted
- **WHEN** the user creates, edits, or deletes data
- **THEN** access is denied

#### Scenario: User with permission override
- **GIVEN** a user with role "consulta" and an explicit override granting `planillas:create`
- **WHEN** the user creates a planilla
- **THEN** access is granted despite the role not including that permission

### Requirement: User Registration (Admin)
The system SHALL allow ADMIN users to create new users with email, password, name, and role. The role field (string) is mapped to a Role record by name.

#### Scenario: Create user with role
- **GIVEN** an authenticated user with `usuarios:create` permission
- **WHEN** the admin sends POST /auth/register with { email, password, nombre, role }
- **THEN** a new user is created with hashed password
- **AND** the user is assigned to the Role matching the given role name
- **AND** the response returns the user without password

#### Scenario: Create user with non-existent role
- **GIVEN** an authenticated user with `usuarios:create` permission
- **WHEN** the admin sends POST /auth/register with a role name that doesn't exist
- **THEN** a 400 Bad Request error is returned

## ADDED Requirements

### Requirement: Auth Context exposes can() function
The frontend AuthContext SHALL provide a `can(resource, action)` function on the context that checks permissions.

#### Scenario: Permission check returns true
- **GIVEN** a user with resolved permissions including `proyectos:create`
- **WHEN** the frontend calls `can('proyectos', 'create')`
- **THEN** the function returns true

#### Scenario: Permission check returns false
- **GIVEN** a user without `usuarios:delete` permission
- **WHEN** the frontend calls `can('usuarios', 'delete')`
- **THEN** the function returns false

### Requirement: Permissions loaded on login
The system SHALL load the user's effective permissions (role-based + overrides) after login and on session restore (/auth/me), returning them in the user object.

#### Scenario: Login returns permissions
- **GIVEN** a user with role "operador" and one override
- **WHEN** the user logs in
- **THEN** the response includes a `permisos` array with all effective permission strings

#### Scenario: Session restore returns permissions
- **GIVEN** a logged-in user with a valid session
- **WHEN** GET /auth/me is called
- **THEN** the response includes the `permisos` array
