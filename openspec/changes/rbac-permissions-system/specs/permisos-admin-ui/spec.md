## ADDED Requirements

### Requirement: Admin Page for Role Management
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
The system SHALL extend the existing usuarios page (/usuarios) with a permission management section for each user.

#### Scenario: View user permissions in user list
- **GIVEN** the /usuarios page
- **WHEN** the page loads
- **THEN** each user row displays their role name (instead of just "admin"/"operador" string)
- **AND** a "Permisos" button is available for admin users

#### Scenario: Admin opens user permission dialog
- **GIVEN** the /usuarios page
- **WHEN** the admin clicks "Permisos" on a user row
- **THEN** a dialog opens showing:
  - Current role selector (dropdown with all available roles)
  - Permission grid with inherited (role-based) permissions shown in a different color/style
  - Checkboxes for explicit permission overrides shown with a visual indicator (e.g., highlighted border)

#### Scenario: Admin changes user role
- **GIVEN** the user permission dialog
- **WHEN** the admin selects a different role from the dropdown
- **THEN** the permission grid updates to show the inherited permissions of the new role
- **AND** any existing overrides are preserved

#### Scenario: Admin assigns explicit permission override
- **GIVEN** the user permission dialog
- **WHEN** the admin checks a permission that is not in the inherited set
- **THEN** the checkbox is visually marked as an override (e.g., different color)
- **AND** when saved, the override is persisted

### Requirement: Visual Differentiation of Inherited vs Override Permissions
The system SHALL visually distinguish between permissions inherited from the role and explicitly overridden permissions.

#### Scenario: Inherited vs override visual
- **GIVEN** the user permission grid
- **WHEN** viewing a user's permissions
- **THEN** inherited permissions show as filled checkboxes in a muted color
- **AND** explicit overrides show as filled checkboxes with a highlighted border or accent color
- **AND** permissions that can be added (not inherited, not assigned) show as empty checkboxes
