import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ClipboardCopy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface CopyButtonProps {
  value: string
  className?: string
  showIcon?: boolean
  variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost" | null | undefined
  size?: "default" | "sm" | "lg" | "icon" | null | undefined
}

export function CopyButton({ 
  value, 
  className,
  showIcon = true,
  variant = "outline",
  size = "default"
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    
    toast({
      description: "Copied to clipboard!",
      duration: 2000,
    })
    
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      onClick={handleCopy}
      size={size}
      variant={variant}
      className={cn(className)}
    >
      {copied ? (
        <Check className={cn("h-4 w-4", showIcon ? "mr-2" : "")} />
      ) : (
        <ClipboardCopy className={cn("h-4 w-4", showIcon ? "mr-2" : "")} />
      )}
      {copied ? "Copied" : "Copy"}
    </Button>
  )
}
