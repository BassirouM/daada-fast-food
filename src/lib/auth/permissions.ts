/**
 * Matrice de permissions par rôle
 *
 * Utilisation :
 *   checkPermission('admin', 'write', 'menu')      // true
 *   checkPermission('customer', 'delete', 'menu')  // false
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type Permission = 'read' | 'write' | 'delete' | 'admin_action'

export type Resource =
  | 'menu'
  | 'commandes'
  | 'profil'
  | 'livraison'
  | 'paiements'
  | 'utilisateurs'
  | 'notifications'
  | 'admin'

export type Role =
  | 'customer'
  | 'delivery_agent'
  | 'kitchen'
  | 'admin'
  | 'super_admin'

// ─── Matrice ──────────────────────────────────────────────────────────────────

const PERMISSIONS: Record<Role, Record<Resource, Permission[]>> = {
  /**
   * Client : parcourt le menu, gère ses commandes et son profil.
   */
  customer: {
    menu:          ['read'],
    commandes:     ['read', 'write'],
    profil:        ['read', 'write'],
    livraison:     ['read'],
    paiements:     ['read', 'write'],
    utilisateurs:  [],
    notifications: ['read'],
    admin:         [],
  },

  /**
   * Livreur : voit ses commandes assignées, met à jour sa position GPS.
   */
  delivery_agent: {
    menu:          ['read'],
    commandes:     ['read', 'write'],   // write = update statut livraison
    profil:        ['read', 'write'],
    livraison:     ['read', 'write'],   // write = update position GPS
    paiements:     [],
    utilisateurs:  [],
    notifications: ['read'],
    admin:         [],
  },

  /**
   * Cuisine : voit toutes les commandes, met à jour les statuts de préparation.
   */
  kitchen: {
    menu:          ['read'],
    commandes:     ['read', 'write'],
    profil:        ['read', 'write'],
    livraison:     [],
    paiements:     [],
    utilisateurs:  [],
    notifications: ['read'],
    admin:         [],
  },

  /**
   * Admin : gestion complète sauf gestion des admins.
   */
  admin: {
    menu:          ['read', 'write', 'delete'],
    commandes:     ['read', 'write', 'delete'],
    profil:        ['read', 'write'],
    livraison:     ['read', 'write', 'delete'],
    paiements:     ['read', 'write'],
    utilisateurs:  ['read', 'write'],
    notifications: ['read', 'write'],
    admin:         ['read'],
  },

  /**
   * Super Admin : accès total, y compris gestion des admins.
   */
  super_admin: {
    menu:          ['read', 'write', 'delete', 'admin_action'],
    commandes:     ['read', 'write', 'delete', 'admin_action'],
    profil:        ['read', 'write', 'delete', 'admin_action'],
    livraison:     ['read', 'write', 'delete', 'admin_action'],
    paiements:     ['read', 'write', 'delete', 'admin_action'],
    utilisateurs:  ['read', 'write', 'delete', 'admin_action'],
    notifications: ['read', 'write', 'delete', 'admin_action'],
    admin:         ['read', 'write', 'delete', 'admin_action'],
  },
}

// ─── Fonctions ────────────────────────────────────────────────────────────────

const VALID_ROLES = new Set<string>([
  'customer', 'delivery_agent', 'kitchen', 'admin', 'super_admin',
])

function isValidRole(role: string): role is Role {
  return VALID_ROLES.has(role)
}

/**
 * Vérifie si un rôle a la permission d'effectuer une action sur une ressource.
 *
 * @param role     - Rôle de l'utilisateur (string, validé en interne)
 * @param action   - Action à vérifier
 * @param resource - Ressource ciblée
 * @returns `true` si autorisé, `false` sinon
 */
export function checkPermission(
  role: string | null | undefined,
  action: Permission,
  resource: Resource
): boolean {
  if (!role || !isValidRole(role)) return false
  const rolePerms    = PERMISSIONS[role]
  const allowedPerms = rolePerms[resource]
  return allowedPerms.includes(action)
}

/**
 * Retourne toutes les permissions d'un rôle sur une ressource.
 */
export function getPermissions(
  role: string | null | undefined,
  resource: Resource
): Permission[] {
  if (!role || !isValidRole(role)) return []
  return PERMISSIONS[role][resource]
}

/**
 * Vérifie si un rôle est admin ou super_admin.
 */
export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'super_admin'
}

/**
 * Vérifie si un rôle peut voir les commandes d'un autre utilisateur.
 * Un client ne peut voir que ses propres commandes.
 */
export function canViewAllOrders(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'super_admin' || role === 'kitchen'
}
