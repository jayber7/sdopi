export type Resource =
  | 'proyectos' | 'planillas' | 'evidencias'
  | 'usuarios' | 'roles' | 'permisos'
  | 'reportes' | 'catalogo' | 'dashboard';

export type Action = 'read' | 'create' | 'update' | 'delete' | 'aprobar' | 'verificar' | 'generate';

export function can(user: { permissions?: string[] } | null, resource: Resource, action: Action): boolean {
  if (!user?.permissions) return false;
  return user.permissions.includes(`${resource}:${action}`);
}

export function hasAny(user: { permissions?: string[] } | null, ...perms: string[]): boolean {
  if (!user?.permissions) return false;
  return perms.some(p => user.permissions!.includes(p));
}
