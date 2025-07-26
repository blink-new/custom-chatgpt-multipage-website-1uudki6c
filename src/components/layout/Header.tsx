import React from 'react'
import { Button } from '../ui/button'
import { Moon, Sun, Settings, MessageSquare } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { Link, useLocation } from 'react-router-dom'

export function Header() {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">
              ChatGPT Clone
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              to="/chat"
              className={`transition-colors hover:text-foreground/80 ${
                location.pathname === '/chat' ? 'text-foreground' : 'text-foreground/60'
              }`}
            >
              Chat
            </Link>
            <Link
              to="/history"
              className={`transition-colors hover:text-foreground/80 ${
                location.pathname === '/history' ? 'text-foreground' : 'text-foreground/60'
              }`}
            >
              History
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search or other content can go here */}
          </div>
          <nav className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-8 w-8 px-0"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Link to="/settings">
              <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}