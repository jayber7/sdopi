## ADDED Requirements

### Requirement: Role Model
The system SHALL define a `Role` model with id, name, description, and its associated permissions.

#### Scenario: Create role
- **GIVEN** an admin user with `roles:create` permission
- **WHEN** the admin sends POST /roles with { name, description, permissions }
- **THEN** a new role is created with the specified permissions
- **AND** the response returns the role data

#### Scenario: Duplicate role name
- **GIVEN** an existing role named "supervisor"
- **WHEN** the admin tries to create another role with name "supervisor"
- **THEN** a 409 Conflict error is returned

### Requirement: Read Roles
The system SHALL allow listing and viewing roles with their associated permissions.

#### Scenario: List roles
- **GIVEN** an authenticated user with `roles:read` permission
- **WHEN** the user sends GET /roles
- **THEN** a list of all roles is returned with their permissions

#### Scenario: Get role by id
- **GIVEN** an authenticated user with `roles:read` permission
- **WHEN** the user sends GET /roles/:id
- **THEN** the role data is returned with its permissions

### Requirement: Update Role
The system SHALL allow updating a role's name, description, and permission set.

#### Scenario: Update role permissions
- **GIVEN** an admin user with `roles:update` permission
- **WHEN** the admin sends PATCH /roles/:id with updated permissions array
- **THEN** the role's permissions are updated
- **AND** all users assigned to this role inherit the new permissions (except users with explicit overrides)

#### Scenario: Update role name
- **GIVEN** an admin user with `roles:update` permission
- **WHEN** the admin sends PATCH /roles/:id with a new name
- **THEN** the role name is updated

### Requirement: Delete Role
The system SHALL allow deleting a role that has no users assigned.

#### Scenario: Delete unassigned role
- **GIVEN** a role with zero assigned users
- **WHEN** the admin sends DELETE /roles/:id
- **THEN** the role is permanently deleted

#### Scenario: Delete role with assigned users
- **GIVEN** a role with at least one assigned user
- **WHEN** the admin sends DELETE /roles/:id
- **THEN** a 409 Conflict error is returned with a message indicating users must be reassigned first

### Requirement: Permission Model
The system SHALL define a `Permission` model with resource name and action identifiers (e.g., `proyectos:read`, `planillas:create`).

#### Scenario: List available permissions
- **GIVEN** an authenticated admin user
- **WHEN** the user sends GET /permisos
- **THEN** a list of all available resource-action pairs is returned

### Requirement: User Permission Override
The system SHALL allow assigning permissions directly to a user, overriding or extending their role-based permissions.

#### Scenario: Assign specific permission to user
- **GIVEN** an admin user with `permisos:assign` permission
- **GIVEN** a user with role "consulta" (read-only)
- **WHEN** the admin sends POST /users/:id/permisos with { permissions: ["planillas:create"] }
- **THEN** the user gains the ability to create planillas in addition to their role's default permissions

#### Scenario: Remove specific user permission
- **GIVEN** a user with an explicit permission override
- **WHEN** the admin sends DELETE /users/:id/permisos/:permissionId
- **THEN** the override is removed and the user falls back to their role-based permissions for that resource

#### Scenario: View user permissions (effective)
- **GIVEN** a user with role-based permissions + overrides
- **WHEN** the admin sends GET /users/:id/permisos
- **THEN** the response includes both the inherited (role) permissions and the explicit overrides, marked accordingly

### Requirement: Default Roles on System Init
The system SHALL seed default roles on first run: admin (full access), operador, supervisor, consulta.

#### Scenario: System seeds default roles
- **GIVEN** a fresh database
- **WHEN** the application starts for the first time
- **THEN** the roles 'admin', 'operador', 'supervisor', 'consulta' are created with predefined permissions
- **AND** existing users with role string 'admin' are automatically assigned the admin role
