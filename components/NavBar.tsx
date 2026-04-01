'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Plus, LogOut } from 'lucide-react'
import { NoodlrIcon } from '@/components/NoodlrIcon'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function NavBar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <header className="border-b bg-background">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/songs" className="flex items-center gap-2 font-semibold text-lg">
          <NoodlrIcon size={28} />
          <span>Noodlr</span>
        </Link>

        <div className="flex items-center gap-2">
          {pathname !== '/songs/new' && (
            <Link href="/songs/new" className={cn(buttonVariants({ size: 'sm' }))}>
              <Plus className="h-4 w-4 mr-1" />
              Add Song
            </Link>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout} className="hover:cursor-pointer">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
