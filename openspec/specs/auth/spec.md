# Auth

## Purpose
Handles user authentication, authorization, role-based access control, and permission management.

## Requirements

### Requirement: User Registration (Admin)
The system SHALL allow ADMIN users to create new users with email, password, name, and role. The role field (string) is mapped to a `Role` record by name.

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

#### Scenario: Duplicate email
- **GIVEN** an existing user with email "test@test.com"
- **WHEN** the admin tries to create a user with the same email
- **THEN** a 409 Conflict error is returned

### Requirement: User Authentication
The system SHALL authenticate users via email and password using JWT tokens in httpOnly cookies with SameSite=None; Secure.

#### Scenario: Successful login
- **GIVEN** a user with valid credentials
- **WHEN** the user sends POST /auth/login with { email, password }
- **THEN** a Set-Cookie header with auth_token is returned
- **AND** the cookie has HttpOnly, Secure, SameSite=None, Path=/, Max-Age=86400
- **AND** the response includes user data (without password)
- **AND** the response includes a `permisos` array with all effective permission strings

#### Scenario: Invalid credentials
- **GIVEN** invalid email or password
- **WHEN** the user sends POST /auth/login
- **THEN** a 401 Unauthorized error is returned
- **AND** no cookie is set

### Requirement: Cross-origin Authentication
The system SHALL support authentication across different origins (frontend and backend on different domains) using an API proxy pattern.

#### Scenario: API calls proxied through frontend origin
- **GIVEN** a frontend at sdopi-frontend.vercel.app and backend at sdopi-backend.vercel.app
- **WHEN** the frontend makes API calls via Next.js rewrites (`/api/*` → backend URL)
- **THEN** the cookie is set on the frontend domain (same origin) so the middleware can validate sessions

#### Scenario: Cookie works on same origin
- **GIVEN** a cookie set via the rewrite proxy (on frontend domain)
- **WHEN** the frontend middleware checks `request.cookies.get('auth_token')`
- **THEN** the cookie is present and the session is valid

### Requirement: Session Verification
The system SHALL expose GET /auth/me to verify the current session and return the user's effective permissions.

#### Scenario: Valid session returns permissions
- **GIVEN** a valid auth_token cookie
- **WHEN** the user sends GET /auth/me
- **THEN** the current user data is returned (without password)
- **AND** the response includes a `permisos` array with all effective permission strings

#### Scenario: Expired or invalid session
- **GIVEN** an expired or invalid auth_token cookie
- **WHEN** the user sends GET /auth/me
- **THEN** a 401 Unauthorized error is returned

### Requirement: Role-Based Access Control (Granular)
The system SHALL restrict access to resources and actions based on user roles AND granular permissions, resolved as `resource:action` pairs (e.g., `proyectos:read`, `planillas:create`). For backwards compatibility, the `role` field on the User model is mapped to a `Role` record. The system resolves effective permissions by merging the role's permissions with any user-specific overrides.

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

### Requirement: Auth Context with can() function
The frontend AuthContext SHALL provide a `can(resource, action)` function that checks the user's effective permissions.

#### Scenario: Permission check returns true
- **GIVEN** a user with resolved permissions including `proyectos:create`
- **WHEN** the frontend calls `can('proyectos', 'create')`
- **THEN** the function returns true

#### Scenario: Permission check returns false
- **GIVEN** a user without `usuarios:delete` permission
- **WHEN** the frontend calls `can('usuarios', 'delete')`
- **THEN** the function returns false

### Requirement: Logout
The system SHALL clear the auth_token cookie on logout.

#### Scenario: Logout
- **GIVEN** an authenticated session
- **WHEN** the user sends POST /auth/logout
- **THEN** the auth_token cookie is cleared
- **AND** a 200 OK is returned

### Requirement: User Management
The system SHALL allow ADMIN users to list, edit, and deactivate users.

#### Scenario: List users
- **GIVEN** an authenticated admin
- **WHEN** the admin sends GET /users
- **THEN** a paginated list of users is returned (without passwords)

#### Scenario: Edit user
- **GIVEN** an admin and an existing user
- **WHEN** the admin sends PATCH /users/:id with updated fields
- **THEN** the user is updated
- **AND** the new data is returned

#### Scenario: Deactivate user
- **GIVEN** an admin and an existing user
- **WHEN** the admin sends DELETE /users/:id
- **THEN** the user's "activo" field is set to false

### Requirement: Permission Guard Decorator (Backend)
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

### Requirement: JWT Permissions Integration
The JWT token SHALL include the user's effective permission strings so the guard can read them without additional database queries.

#### Scenario: Permissions in JWT
- **GIVEN** a logged-in user with resolved permissions
- **WHEN** the user authenticates
- **THEN** the JWT payload includes an array of effective permission strings (e.g., ["proyectos:read", "planillas:create"])

### Requirement: Route Permission Mapping (Frontend Middleware)
The Next.js middleware SHALL decode the JWT to read permissions and enforce route access based on a route-to-permission mapping.

#### Scenario: Protected route requires specific permission
- **GIVEN** a mapping `{ '/proyectos/*': 'proyectos:read', '/admin/usuarios': 'usuarios:read' }`
- **WHEN** a user without `usuarios:read` tries to navigate to /admin/usuarios
- **THEN** the middleware redirects to a 403 page or home page

#### Scenario: Public routes bypass permission check
- **GIVEN** the /login route is in the public paths list
- **WHEN** any user navigates to /login
- **THEN** the middleware does not check permissions

#### Scenario: Missing or invalid JWT on protected route
- **GIVEN** no valid auth_token cookie
- **WHEN** the middleware processes a protected route request
- **THEN** the user is redirected to /login
- **AND** the original path is preserved in the `from` query parameter

### Requirement: 403 Access Denied Page
The system SHALL display a "403 Acceso Denegado" page when the user lacks permission for a route.

#### Scenario: Insufficient permissions
- **GIVEN** an authenticated user without `roles:read` permission
- **WHEN** the user tries to navigate to /admin/roles
- **THEN** the 403 page is displayed with a message indicating insufficient permissions
- **AND** a "Volver al inicio" button is shown

### Requirement: Role Management (Admin UI)
The system SHALL provide a UI page at /admin/roles for managing roles, listing all roles with their permissions, and creating/editing/deleting roles.

#### Scenario: Admin views roles list
- **GIVEN** an authenticated user with `roles:read` permission
- **WHEN** the user navigates to /admin/roles
- **THEN** a table of all roles is displayed with columns: name, description, permission count, user count, actions

#### Scenario: Admin creates a new role
- **GIVEN** an admin user with `roles:create` permission
- **WHEN** the user clicks "Nuevo Rol" and submits the form with name, description, and selected permissions
- **THEN** the new role is created and appears in the roles list

#### Scenario: Admin edits a role
- **GIVEN** an admin user with `roles:update` permission
- **WHEN** the user clicks "Editar" on a role row and modifies its name or permissions
- **THEN** the role is updated and changes are reflected immediately

### Requirement: Permission Assignment Grid
The system SHALL provide a grid UI (resources × actions) with checkboxes for assigning permissions to roles and users.

#### Scenario: Grid displays all resources and actions
- **GIVEN** an admin editing a role or user permissions
- **WHEN** the permission grid is shown
- **THEN** each row is a resource (proyectos, planillas, evidencias, reportes, usuarios, catalogo, roles, permisos)
- **AND** each column is an action (read, create, update, delete, aprobar, enviar, verificar, assign, export)
- **AND** checkboxes indicate which resource+action pairs are granted

#### Scenario: Bulk select/deselect all
- **GIVEN** the permission grid
- **WHEN** the user clicks "Seleccionar Todo" or "Deseleccionar Todo"
- **THEN** all checkboxes in the grid are toggled accordingly

### Requirement: User Permission Management
The system SHALL allow admins to manage user permissions including role assignment and explicit permission overrides.

#### Scenario: View user permissions in user list
- **GIVEN** the /usuarios page
- **WHEN** the page loads
- **THEN** each user row displays their role name
- **AND** a "Permisos" button is available for admin users

#### Scenario: Admin opens user permission dialog
- **GIVEN** the /usuarios page
- **WHEN** the admin clicks "Permisos" on a user row
- **THEN** a dialog opens showing current role selector, permission grid with inherited permissions, and checkboxes for explicit overrides

#### Scenario: Admin changes user role
- **GIVEN** the user permission dialog
- **WHEN** the admin selects a different role from the dropdown
- **THEN** the permission grid updates to show the inherited permissions of the new role

#### Scenario: Admin assigns explicit permission override
- **GIVEN** the user permission dialog
- **WHEN** the admin checks a permission not in the inherited set
- **THEN** the checkbox is visually marked as an override (e.g., different color)

### Requirement: Role Model (Backend)
The system SHALL define a `Role` model with CRUD operations and associated permissions.

#### Scenario: Create role
- **GIVEN** an admin user with `roles:create` permission
- **WHEN** the admin sends POST /roles with { name, description, permissions }
- **THEN** a new role is created with the specified permissions

#### Scenario: Duplicate role name
- **GIVEN** an existing role named "supervisor"
- **WHEN** the admin tries to create another role with name "supervisor"
- **THEN** a 409 Conflict error is returned

#### Scenario: List roles
- **GIVEN** an authenticated user with `roles:read` permission
- **WHEN** the user sends GET /roles
- **THEN** a list of all roles is returned with their permissions

#### Scenario: Update role permissions
- **GIVEN** an admin user with `roles:update` permission
- **WHEN** the admin sends PATCH /roles/:id with updated permissions array
- **THEN** the role's permissions are updated

#### Scenario: Delete unassigned role
- **GIVEN** a role with zero assigned users
- **WHEN** the admin sends DELETE /roles/:id
- **THEN** the role is permanently deleted

#### Scenario: Delete role with assigned users
- **GIVEN** a role with at least one assigned user
- **WHEN** the admin sends DELETE /roles/:id
- **THEN** a 409 Conflict error is returned

### Requirement: Permission Model
The system SHALL define a `Permission` model with resource and action identifiers (e.g., `proyectos:read`).

#### Scenario: List available permissions
- **GIVEN** an authenticated admin user
- **WHEN** the user sends GET /permisos
- **THEN** a list of all available resource-action pairs is returned

### Requirement: User Permission Override (API)
The system SHALL allow assigning permissions directly to a user, overriding or extending their role-based permissions.

#### Scenario: Assign specific permission to user
- **GIVEN** an admin user with `permisos:assign` permission
- **GIVEN** a user with role "consulta" (read-only)
- **WHEN** the admin sends POST /users/:id/permisos with { permissions: ["planillas:create"] }
- **THEN** the user gains the ability to create planillas

#### Scenario: Remove specific user permission
- **GIVEN** a user with an explicit permission override
- **WHEN** the admin sends DELETE /users/:id/permisos/:permissionId
- **THEN** the override is removed and the user falls back to role-based permissions

#### Scenario: View user permissions (effective)
- **GIVEN** a user with role-based permissions + overrides
- **WHEN** the admin sends GET /users/:id/permisos
- **THEN** the response includes inherited (role) permissions and explicit overrides

### Requirement: Default Roles on System Init
The system SHALL seed default roles on first run.

#### Scenario: System seeds default roles
- **GIVEN** a fresh database
- **WHEN** the application starts for the first time
- **THEN** the roles 'admin', 'operador', 'supervisor', 'consulta' are created with predefined permissions
- **AND** existing users with role string 'admin' are automatically assigned the admin role
