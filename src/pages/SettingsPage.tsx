import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Input } from '../components/ui/input'
import { useToast } from '../hooks/use-toast'
import { groqService } from '../services/groq'
import { blink } from '../blink/client'

export function SettingsPage() {
  const [selectedModel, setSelectedModel] = useState('llama-3.3-70b-versatile')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(2048)
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Load user and settings
    const loadUserData = async () => {
      try {
        const userData = await blink.auth.me()
        setUser(userData)
      } catch (error) {
        console.error('Failed to load user data:', error)
      }
    }

    loadUserData()

    // Load saved settings
    const savedModel = localStorage.getItem('groq_model') || 'llama-3.3-70b-versatile'
    const savedTemperature = parseFloat(localStorage.getItem('groq_temperature') || '0.7')
    const savedMaxTokens = parseInt(localStorage.getItem('groq_max_tokens') || '2048')

    setSelectedModel(savedModel)
    setTemperature(savedTemperature)
    setMaxTokens(savedMaxTokens)
  }, [])

  const handleSaveSettings = () => {
    // Save settings to localStorage
    localStorage.setItem('groq_model', selectedModel)
    localStorage.setItem('groq_temperature', temperature.toString())
    localStorage.setItem('groq_max_tokens', maxTokens.toString())

    toast({
      title: 'Settings Saved',
      description: 'Your configuration has been saved successfully'
    })
  }

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100)
  }

  const getLimitsForTier = (tier: string) => {
    const limits = {
      free: { messages: 1000, tokens: 50000 },
      basic: { messages: 10000, tokens: 500000 },
      pro: { messages: 50000, tokens: 2500000 }
    }
    return limits[tier as keyof typeof limits] || limits.free
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-2">Configure your AI assistant preferences</p>
      </div>

      {user && (
        <Card>
          <CardHeader>
            <CardTitle>Account & Usage</CardTitle>
            <CardDescription>
              Your current subscription and usage statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Subscription Tier</Label>
                <p className="text-lg font-semibold capitalize">{user.subscriptionTier || 'free'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Messages Used</span>
                  <span>{user.messageCount || 0} / {getLimitsForTier(user.subscriptionTier || 'free').messages}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-[#10a37f] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getUsagePercentage(user.messageCount || 0, getLimitsForTier(user.subscriptionTier || 'free').messages)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm">
                  <span>Tokens Used</span>
                  <span>{(user.tokenCount || 0).toLocaleString()} / {getLimitsForTier(user.subscriptionTier || 'free').tokens.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-[#10a37f] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getUsagePercentage(user.tokenCount || 0, getLimitsForTier(user.subscriptionTier || 'free').tokens)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>AI Model Configuration</CardTitle>
          <CardDescription>
            Configure your preferred AI model and parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="model">Model</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groqService.getAvailableModels().map(model => (
                  <SelectItem key={model.id} value={model.id}>
                    <div>
                      <div className="font-medium">{model.name}</div>
                      <div className="text-sm text-gray-500">{model.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="temperature">Temperature: {temperature}</Label>
            <input
              id="temperature"
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              Controls randomness: 0 = focused, 2 = creative
            </p>
          </div>

          <div>
            <Label htmlFor="max-tokens">Max Tokens</Label>
            <Input
              id="max-tokens"
              type="number"
              min="1"
              max="4096"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              Maximum length of the AI response
            </p>
          </div>

          <Button onClick={handleSaveSettings} className="w-full">
            Save Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About Groq & Llama 3.3 70B</CardTitle>
          <CardDescription>
            Information about the AI model powering your assistant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <p><strong>Groq LPU Technology:</strong></p>
              <p className="text-gray-600">Ultra-fast AI inference with sub-millisecond latency, 18x faster than traditional GPUs.</p>
            </div>
            
            <div>
              <p><strong>Llama 3.3 70B Features:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
                <li>128K token context window</li>
                <li>Multilingual support (8 languages)</li>
                <li>Advanced reasoning and coding capabilities</li>
                <li>High-quality responses with fast generation</li>
              </ul>
            </div>

            <div>
              <p><strong>Rate Limits:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
                <li>30 requests per minute</li>
                <li>~6,000 tokens per minute</li>
                <li>Automatic fallback to alternative models if needed</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}