## ADDED Requirements

### Requirement: Route Permission Mapping
The system SHALL define a route-to-permission mapping in the middleware that maps URL paths to required permissions.

#### Scenario: Protected route requires specific permission
- **GIVEN** a mapping `{ '/proyectos/*': 'proyectos:read', '/admin/usuarios': 'usuarios:read' }`
- **WHEN** a user without `usuarios:read` tries to navigate to /admin/usuarios
- **THEN** the middleware redirects to a 403 page or home page

#### Scenario: Public routes bypass permission check
- **GIVEN** the /login route is in the public paths list
- **WHEN** any user navigates to /login
- **THEN** the middleware does not check permissions

### Requirement: Permission Cache in Next.js Middleware
The system SHALL decode the JWT in the middleware to read permissions without making an API call.

#### Scenario: JWT contains permissions
- **GIVEN** a valid auth_token JWT
- **WHEN** the middleware decodes the JWT
- **THEN** it extracts the permissions array
- **AND** checks the current route against the required permissions

#### Scenario: Missing or invalid JWT on protected route
- **GIVEN** no valid auth_token cookie
- **WHEN** the middleware processes a protected route request
- **THEN** the user is redirected to /login
- **AND** the original path is preserved in the `from` query parameter

### Requirement: 403 Page
The system SHALL display a "403 Acceso Denegado" page when the user lacks permission for a route.

#### Scenario: Insufficient permissions
- **GIVEN** an authenticated user without `roles:read` permission
- **WHEN** the user tries to navigate to /admin/roles
- **THEN** the 403 page is displayed with a message indicating insufficient permissions
- **AND** a "Volver al inicio" button is shown
