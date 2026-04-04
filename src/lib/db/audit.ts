/**
 * Utilitaire : écriture dans audit_log
 * Toutes les actions admin sensibles doivent passer par cette fonction.
 */

import { db } from '@/lib/supabase'

export async function logAudit({
  userId,
  action,
  tableName,
  recordId,
  oldData,
  newData,
}: {
  userId: string
  action: string
  tableName: string
  recordId?: string | null
  oldData?: Record<string, unknown> | null
  newData?: Record<string, unknown> | null
}): Promise<void> {
  const { error } = await db.from('audit_log').insert({
    user_id:    userId,
    action,
    table_name: tableName,
    record_id:  recordId  ?? null,
    old_data:   oldData   ?? null,
    new_data:   newData   ?? null,
    ip_address: null,
  })

  if (error) {
    // Non-bloquant : l'audit ne doit jamais faire échouer l'action principale
    console.warn('[audit_log] insert failed:', error.message)
  }
}
