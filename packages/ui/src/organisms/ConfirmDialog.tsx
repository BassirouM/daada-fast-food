'use client'

import * as React from 'react'
import { cn } from '../utils'
import { Modal } from './Modal'
import { Button } from '../atoms/Button'

export interface ConfirmDialogProps {
  open:          boolean
  onConfirm:     () => void | Promise<void>
  onCancel:      () => void
  title?:        string
  description?:  string
  confirmLabel?: string
  cancelLabel?:  string
  danger?:       boolean
  loading?:      boolean
  className?:    string
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title        = 'Confirmer l\'action',
  description  = 'Cette action est irréversible. Voulez-vous continuer ?',
  confirmLabel = 'Confirmer',
  cancelLabel  = 'Annuler',
  danger       = false,
  loading      = false,
  className,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = React.useState(false)
  const isLoading = loading || internalLoading

  async function handleConfirm() {
    if (isLoading) return
    const result = onConfirm()
    if (result instanceof Promise) {
      setInternalLoading(true)
      try {
        await result
      } finally {
        setInternalLoading(false)
      }
    }
  }

  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="sm"
      hideClose
      title={title}
      description={description}
      className={className}
      footer={
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
            aria-label={cancelLabel}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            size="sm"
            onClick={handleConfirm}
            loading={isLoading}
            aria-label={confirmLabel}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {/* Extra slot for custom content between description and footer */}
      <div className={cn('hidden', className && 'block')} aria-hidden />
    </Modal>
  )
}
