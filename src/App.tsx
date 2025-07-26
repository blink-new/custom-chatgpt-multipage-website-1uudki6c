import React, { useState, useEffect } from 'react'
import { blink } from './blink/client'
import { ChatInterface } from './components/chat/ChatInterface'
import { SettingsPage } from './pages/SettingsPage'
import { ThemeProvider } from './contexts/ThemeProvider'
import { Toaster } from './components/ui/toaster'
import { User } from './types/chat'
import { Loader2 } from 'lucide-react'

type AppView = 'chat' | 'settings'

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#10a37f]" />
          <p className="text-gray-600">Loading ChatGPT Clone...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#10a37f] to-[#0d8f6b] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#10a37f] rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white font-bold text-2xl">AI</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to ChatGPT Clone</h1>
            <p className="text-gray-600 mb-8">
              A fully functional ChatGPT-like experience powered by Groq's Llama 3.3 70B model
            </p>
            <button
              onClick={() => blink.auth.login()}
              className="w-full bg-[#10a37f] hover:bg-[#0d8f6b] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Sign In to Continue
            </button>
            <p className="text-xs text-gray-500 mt-4">
              Sign in to save your conversations and access all features
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white">
        {currentView === 'chat' && (
          <ChatInterface
            user={user}
            onSettingsClick={() => setCurrentView('settings')}
          />
        )}
        
        {currentView === 'settings' && (
          <SettingsPage
            user={user}
            onBack={() => setCurrentView('chat')}
          />
        )}
        
        <Toaster />
      </div>
    </ThemeProvider>
  )
}

export default App