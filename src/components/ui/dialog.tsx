import * as React from "react"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContentProps {
  children: React.ReactNode
  className?: string
}

interface DialogHeaderProps {
  children: React.ReactNode
}

interface DialogTitleProps {
  children: React.ReactNode
  className?: string
}

interface DialogDescriptionProps {
  children: React.ReactNode
  className?: string
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative z-50 w-full max-w-lg mx-4">
        {children}
      </div>
    </div>
  )
}

export function DialogContent({ children, className = "" }: DialogContentProps) {
  return (
    <div className={`bg-background border rounded-lg shadow-lg p-6 ${className}`}>
      {children}
    </div>
  )
}

export function DialogHeader({ children }: DialogHeaderProps) {
  return <div className="mb-4">{children}</div>
}

export function DialogTitle({ children, className = "" }: DialogTitleProps) {
  return <h2 className={`text-2xl font-bold ${className}`}>{children}</h2>
}

export function DialogDescription({ children, className = "" }: DialogDescriptionProps) {
  return <p className={`text-muted-foreground ${className}`}>{children}</p>
}

