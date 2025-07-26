import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Slider } from '../components/ui/slider'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Save, Key, AlertCircle } from 'lucide-react'
import { blink } from '../blink/client'
import { ApiSettings } from '../types/chat'
import { toast } from '../hooks/use-toast'

export function SettingsPage() {
  const [user, setUser] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gpt-4o-mini')
  const [temperature, setTemperature] = useState([0.7])
  const [maxTokens, setMaxTokens] = useState(2000)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Auth state management
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  // Load existing settings
  useEffect(() => {
    if (!user?.id) return

    const loadSettings = async () => {
      setIsLoading(true)
      try {
        const settings = await blink.db.apiSettings.list({
          where: { userId: user.id },
          limit: 1
        })

        if (settings.length > 0) {
          const setting = settings[0]
          setApiKey(setting.apiKey || '')
          setModel(setting.model || 'gpt-4o-mini')
          setTemperature([setting.temperature || 0.7])
          setMaxTokens(setting.maxTokens || 2000)
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [user?.id])

  const saveSettings = async () => {
    if (!user?.id) return

    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key.",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    try {
      // Check if settings exist
      const existingSettings = await blink.db.apiSettings.list({
        where: { userId: user.id },
        limit: 1
      })

      const settingsData: Omit<ApiSettings, 'id'> = {
        userId: user.id,
        apiKey: apiKey.trim(),
        model,
        temperature: temperature[0],
        maxTokens
      }

      if (existingSettings.length > 0) {
        // Update existing settings
        await blink.db.apiSettings.update(existingSettings[0].id, settingsData)
      } else {
        // Create new settings
        await blink.db.apiSettings.create({
          id: `settings_${user.id}`,
          ...settingsData
        })
      }

      toast({
        title: "Settings saved",
        description: "Your API settings have been saved successfully."
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your OpenAI API settings to start chatting.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Configuration
            </CardTitle>
            <CardDescription>
              Enter your OpenAI API key and configure model settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your API key is stored securely and only used to make requests to OpenAI on your behalf.
                Get your API key from{' '}
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  OpenAI Platform
                </a>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="apiKey">OpenAI API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select value={model} onValueChange={setModel} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini (Recommended)</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">
                Temperature: {temperature[0]}
              </Label>
              <Slider
                id="temperature"
                min={0}
                max={2}
                step={0.1}
                value={temperature}
                onValueChange={setTemperature}
                disabled={isLoading}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Controls randomness. Lower values make responses more focused and deterministic.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                min={1}
                max={4000}
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value) || 2000)}
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                Maximum number of tokens in the response (1 token ≈ 4 characters).
              </p>
            </div>

            <Button 
              onClick={saveSettings} 
              disabled={isLoading || isSaving}
              className="w-full"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage & Billing</CardTitle>
            <CardDescription>
              Monitor your OpenAI API usage and costs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You can monitor your API usage and billing directly on the{' '}
              <a 
                href="https://platform.openai.com/usage" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                OpenAI Platform
              </a>
              . Costs are charged directly to your OpenAI account.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}