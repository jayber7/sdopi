# Auth

## Purpose
Handles user authentication, authorization, and role-based access control.

## Requirements

### Requirement: User Registration (Admin)
The system SHALL allow ADMIN users to create new users with email, password, name, and role.

#### Scenario: Create user
- GIVEN an authenticated user with role "admin"
- WHEN the admin sends POST /auth/register with { email, password, nombre, role }
- THEN a new user is created with hashed password
- AND the response returns the user without password

#### Scenario: Duplicate email
- GIVEN an existing user with email "test@test.com"
- WHEN the admin tries to create a user with the same email
- THEN a 409 Conflict error is returned

### Requirement: User Authentication
The system SHALL authenticate users via email and password using JWT tokens in httpOnly cookies.

#### Scenario: Successful login
- GIVEN a user with valid credentials
- WHEN the user sends POST /auth/login with { email, password }
- THEN a Set-Cookie header with auth_token is returned
- AND the response includes user data (without password)

#### Scenario: Invalid credentials
- GIVEN invalid email or password
- WHEN the user sends POST /auth/login
- THEN a 401 Unauthorized error is returned
- AND no cookie is set

### Requirement: Session Verification
The system SHALL expose GET /auth/me to verify the current session.

#### Scenario: Valid session
- GIVEN a valid auth_token cookie
- WHEN the user sends GET /auth/me
- THEN the current user data is returned (without password)

#### Scenario: Expired or invalid session
- GIVEN an expired or invalid auth_token cookie
- WHEN the user sends GET /auth/me
- THEN a 401 Unauthorized error is returned

### Requirement: Role-Based Access Control
The system SHALL restrict access to resources based on user roles.

#### Scenario: Admin access
- GIVEN a user with role "admin"
- WHEN the user accesses any resource
- THEN full access is granted

#### Scenario: Operador access
- GIVEN a user with role "operador"
- WHEN the user creates or edits planillas
- THEN access is granted
- WHEN the user manages users
- THEN access is denied

#### Scenario: Consulta access
- GIVEN a user with role "consulta"
- WHEN the user views dashboards and reports
- THEN access is granted
- WHEN the user creates, edits, or deletes data
- THEN access is denied

### Requirement: Logout
The system SHALL clear the auth_token cookie on logout.

#### Scenario: Logout
- GIVEN an authenticated session
- WHEN the user sends POST /auth/logout
- THEN the auth_token cookie is cleared
- AND a 200 OK is returned

### Requirement: User Management
The system SHALL allow ADMIN users to list, edit, and deactivate users.

#### Scenario: List users
- GIVEN an authenticated admin
- WHEN the admin sends GET /users
- THEN a paginated list of users is returned (without passwords)

#### Scenario: Edit user
- GIVEN an admin and an existing user
- WHEN the admin sends PATCH /users/:id with updated fields
- THEN the user is updated
- AND the new data is returned

#### Scenario: Deactivate user
- GIVEN an admin and an existing user
- WHEN the admin sends DELETE /users/:id
- THEN the user's "activo" field is set to false
