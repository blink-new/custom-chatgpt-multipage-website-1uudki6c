import React, { useState, useEffect } from 'react'
import { blink } from './blink/client'
import { ChatInterface } from './components/chat/ChatInterface'
import { CodeBuilder } from './components/code/CodeBuilder'
import { AdminPanel } from './components/admin/AdminPanel'
import { SettingsPage } from './pages/SettingsPage'
import { ThemeProvider } from './contexts/ThemeProvider'
import { Toaster } from './components/ui/toaster'
import { User } from './types/chat'
import { Loader2, Code, Shield, Settings, MessageSquare } from 'lucide-react'
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'

type AppView = 'chat' | 'code' | 'admin' | 'settings'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentView, setCurrentView] = useState<AppView>('chat')

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged(async (state) => {
      if (state.user && !state.isLoading) {
        try {
          // Check if user exists in our database
          const existingUsers = await blink.db.users.list({
            where: { id: state.user.id }
          })

          let userData: User
          if (existingUsers.length === 0) {
            // Create new user record
            userData = await blink.db.users.create({
              id: state.user.id,
              email: state.user.email || '',
              subscriptionTier: 'free',
              messageCount: 0,
              tokenCount: 0,
              role: 'user',
              isActive: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
          } else {
            userData = existingUsers[0] as User
          }

          setUser(userData)
        } catch (error) {
          console.error('Failed to load user data:', error)
        }
      } else if (!state.isLoading) {
        setUser(null)
      }
      setIsLoading(state.isLoading)
    })

    return unsubscribe
  }, [])

  // Create floating particles effect
  useEffect(() => {
    const createParticle = () => {
      const particle = document.createElement('div')
      particle.className = 'particle'
      particle.style.left = Math.random() * 100 + '%'
      particle.style.animationDelay = Math.random() * 20 + 's'
      particle.style.animationDuration = (Math.random() * 10 + 15) + 's'
      
      const particles = document.querySelector('.particles')
      if (particles) {
        particles.appendChild(particle)
        
        // Remove particle after animation
        setTimeout(() => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle)
          }
        }, 25000)
      }
    }

    // Create initial particles
    for (let i = 0; i < 20; i++) {
      setTimeout(createParticle, i * 1000)
    }

    // Continue creating particles
    const interval = setInterval(createParticle, 2000)
    
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="particles"></div>
        <div className="text-center relative z-10">
          <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Loading ChatGPT Clone</h1>
          <p className="text-gray-300">Powered by Groq's Llama 3.3 70B</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="particles"></div>
        <div className="bg-black/20 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-white/10 relative z-10">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 glow-effect">
              <span className="text-white font-bold text-3xl">AI</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to ChatGPT Clone</h1>
            <p className="text-gray-300 mb-8">
              Experience the power of Groq's Llama 3.3 70B model with ultra-fast inference, 
              code building capabilities, and advanced admin controls.
            </p>
            <button
              onClick={() => blink.auth.login()}
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 glow-effect"
            >
              Sign In to Continue
            </button>
            <p className="text-xs text-gray-400 mt-4">
              Sign in to access chat, code builder, and admin features
            </p>
          </div>
        </div>
      </div>
    )
  }

  const isAdmin = user.role === 'admin'

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background dark:dark-animated-bg">
        <div className="particles"></div>
        
        {/* Navigation Header */}
        <div className="border-b bg-card/50 backdrop-blur-sm relative z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <h1 className="text-xl font-bold">ChatGPT Clone</h1>
                <Badge variant="secondary" className="ml-2">
                  Groq Powered
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={currentView === 'chat' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('chat')}
                  className="glow-effect"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Chat
                </Button>
                
                <Button
                  variant={currentView === 'code' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('code')}
                  className="glow-effect"
                >
                  <Code className="h-4 w-4 mr-1" />
                  Code Builder
                </Button>
                
                {isAdmin && (
                  <Button
                    variant={currentView === 'admin' ? 'destructive' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentView('admin')}
                    className="glow-effect"
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Admin
                  </Button>
                )}
                
                <Button
                  variant={currentView === 'settings' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('settings')}
                  className="glow-effect"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1)}
              </Badge>
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => blink.auth.logout()}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="h-[calc(100vh-73px)] relative z-10">
          {currentView === 'chat' && (
            <ChatInterface
              user={user}
              onSettingsClick={() => setCurrentView('settings')}
            />
          )}
          
          {currentView === 'code' && (
            <CodeBuilder />
          )}
          
          {currentView === 'admin' && isAdmin && (
            <AdminPanel />
          )}
          
          {currentView === 'settings' && (
            <SettingsPage
              user={user}
              onBack={() => setCurrentView('chat')}
            />
          )}
          
          {currentView === 'admin' && !isAdmin && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                <p className="text-muted-foreground">You need admin privileges to access this section.</p>
              </div>
            </div>
          )}
        </div>
        
        <Toaster />
      </div>
    </ThemeProvider>
  )
}

export default App