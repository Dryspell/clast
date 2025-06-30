"use client"

import Link from "next/link"
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu"

import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
} from '@/components/ui/menubar'
import { Button } from '@/components/ui/button'
import { useSession, signIn, signOut } from 'next-auth/react'

export function SiteHeader() {
  const { data: session, status } = useSession()

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-6">
        <Link href="/" className="text-lg font-semibold">
          CLAST
        </Link>
        <div className="flex items-center gap-4">
          <NavigationMenu className="hidden sm:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/" className="px-3 py-2">
                    Editor
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/docs" className="px-3 py-2">
                    Docs
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/docs/features" className="px-3 py-2">
                    Features
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* File / Edit menu bar */}
          <Menubar>
            <MenubarMenu>
              <MenubarTrigger>File</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>New</MenubarItem>
                <MenubarItem>Open</MenubarItem>
                <MenubarSeparator />
                <MenubarItem onSelect={() => { /* TODO: Connect save action via context */ }}>Save</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>Edit</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>Undo</MenubarItem>
                <MenubarItem>Redo</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>

          {/* Auth controls */}
          {status === 'loading' ? null : !session ? (
            <Button size="sm" onClick={() => signIn()}>Sign&nbsp;in</Button>
          ) : (
            <Menubar>
              <MenubarMenu>
                <MenubarTrigger className="focus:outline-none">
                  {session.user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt="avatar"
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <span className="font-medium">{session.user?.name ?? 'User'}</span>
                  )}
                </MenubarTrigger>
                <MenubarContent align="end">
                  <MenubarItem disabled>{session.user?.email}</MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem onSelect={() => signOut()}>Sign out</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          )}
        </div>
      </div>
    </header>
  )
} 