import React from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { MessageSquare, Zap, Shield, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
            Your Personal
            <span className="text-primary"> ChatGPT</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Experience the power of AI conversation with your own API key. 
            Secure, private, and fully customizable.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/chat">
              <Button size="lg" className="text-lg px-8">
                Start Chatting
                <MessageSquare className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="outline" size="lg" className="text-lg px-8">
                Configure API
                <Settings className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Fast & Responsive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Experience lightning-fast responses with streaming AI conversations 
                that feel natural and immediate.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Your Data, Your Control
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Use your own OpenAI API key. Your conversations and data 
                remain completely private and under your control.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Full Chat Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Multiple conversations, chat history, message regeneration, 
                and all the features you expect from a modern AI assistant.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-6">
            Configure your OpenAI API key in settings and start your first conversation.
          </p>
          <Link to="/settings">
            <Button variant="outline">
              Go to Settings
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}