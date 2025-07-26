import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Code, 
  Play, 
  Save, 
  Copy, 
  Download, 
  Upload, 
  Trash2, 
  Eye, 
  EyeOff,
  Settings,
  Palette,
  Terminal,
  FileCode,
  Zap
} from 'lucide-react';
import { blink } from '@/blink/client';

interface CodeSnippet {
  id: string;
  title: string;
  language: string;
  code: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', color: '#f7df1e' },
  { value: 'typescript', label: 'TypeScript', color: '#3178c6' },
  { value: 'python', label: 'Python', color: '#3776ab' },
  { value: 'java', label: 'Java', color: '#ed8b00' },
  { value: 'cpp', label: 'C++', color: '#00599c' },
  { value: 'html', label: 'HTML', color: '#e34f26' },
  { value: 'css', label: 'CSS', color: '#1572b6' },
  { value: 'sql', label: 'SQL', color: '#336791' },
  { value: 'json', label: 'JSON', color: '#000000' },
  { value: 'markdown', label: 'Markdown', color: '#083fa1' },
];

const THEMES = [
  { value: 'dark', label: 'Dark', bg: '#1e1e1e', text: '#d4d4d4' },
  { value: 'monokai', label: 'Monokai', bg: '#272822', text: '#f8f8f2' },
  { value: 'github', label: 'GitHub', bg: '#ffffff', text: '#24292e' },
  { value: 'dracula', label: 'Dracula', bg: '#282a36', text: '#f8f8f2' },
];

export function CodeBuilder() {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [currentSnippet, setCurrentSnippet] = useState<CodeSnippet | null>(null);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isPublic, setIsPublic] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState(14);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');

  const clearEditor = () => {
    setCurrentSnippet(null);
    setTitle('');
    setCode('');
    setDescription('');
    setLanguage('javascript');
    setIsPublic(false);
  };

  const getFileExtension = (lang: string) => {
    const extensions: { [key: string]: string } = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      html: 'html',
      css: 'css',
      sql: 'sql',
      json: 'json',
      markdown: 'md'
    };
    return extensions[lang] || 'txt';
  };

  const getLanguageColor = (lang: string) => {
    return LANGUAGES.find(l => l.value === lang)?.color || '#666666';
  };

  const loadSnippets = async () => {
    try {
      const user = await blink.auth.me();
      const userSnippets = await blink.db.codeSnippets.list({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' }
      });
      setSnippets(userSnippets);
    } catch (error) {
      console.error('Failed to load snippets:', error);
    }
  };

  useEffect(() => {
    loadSnippets();
  }, []);

  const saveSnippet = async () => {
    if (!title.trim() || !code.trim()) {
      toast.error('Title and code are required');
      return;
    }

    setIsLoading(true);
    try {
      const user = await blink.auth.me();
      
      if (currentSnippet) {
        // Update existing snippet
        await blink.db.codeSnippets.update(currentSnippet.id, {
          title: title.trim(),
          code: code.trim(),
          description: description.trim(),
          language,
          isPublic: isPublic ? 1 : 0,
          updatedAt: new Date().toISOString()
        });
        toast.success('Snippet updated successfully');
      } else {
        // Create new snippet
        await blink.db.codeSnippets.create({
          id: `snippet_${Date.now()}`,
          userId: user.id,
          title: title.trim(),
          code: code.trim(),
          description: description.trim(),
          language,
          isPublic: isPublic ? 1 : 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        toast.success('Snippet saved successfully');
      }
      
      await loadSnippets();
      clearEditor();
    } catch (error) {
      console.error('Failed to save snippet:', error);
      toast.error('Failed to save snippet');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSnippet = (snippet: CodeSnippet) => {
    setCurrentSnippet(snippet);
    setTitle(snippet.title);
    setCode(snippet.code);
    setDescription(snippet.description || '');
    setLanguage(snippet.language);
    setIsPublic(Number(snippet.isPublic) > 0);
    setActiveTab('editor');
  };

  const deleteSnippet = async (snippetId: string) => {
    try {
      await blink.db.codeSnippets.delete(snippetId);
      await loadSnippets();
      if (currentSnippet?.id === snippetId) {
        clearEditor();
      }
      toast.success('Snippet deleted successfully');
    } catch (error) {
      console.error('Failed to delete snippet:', error);
      toast.error('Failed to delete snippet');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadSnippet = (snippet: CodeSnippet) => {
    const element = document.createElement('a');
    const file = new Blob([snippet.code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${snippet.title}.${getFileExtension(snippet.language)}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const currentTheme = THEMES.find(t => t.value === theme) || THEMES[0];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Code Builder</h2>
          <Badge variant="secondary" className="ml-2">
            <Zap className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editor Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {THEMES.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: t.bg }}
                            />
                            {t.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Font Size: {fontSize}px</Label>
                  <input
                    type="range"
                    min="10"
                    max="24"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Show Line Numbers</Label>
                  <Switch
                    checked={showLineNumbers}
                    onCheckedChange={setShowLineNumbers}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button 
            onClick={saveSnippet} 
            disabled={isLoading}
            className="glow-effect"
          >
            <Save className="h-4 w-4 mr-1" />
            {currentSnippet ? 'Update' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 border-r bg-card/50 backdrop-blur-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-2 m-2">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="snippets">Snippets</TabsTrigger>
            </TabsList>
            
            <TabsContent value="editor" className="p-4 space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter snippet title..."
                />
              </div>
              
              <div>
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(lang => (
                      <SelectItem key={lang.value} value={lang.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: lang.color }}
                          />
                          {lang.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={3}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Make Public</Label>
                <Switch
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>
              
              <Button 
                onClick={clearEditor} 
                variant="outline" 
                className="w-full"
              >
                <FileCode className="h-4 w-4 mr-1" />
                New Snippet
              </Button>
            </TabsContent>
            
            <TabsContent value="snippets" className="p-0">
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="p-4 space-y-2">
                  {snippets.map(snippet => (
                    <Card 
                      key={snippet.id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => loadSnippet(snippet)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: getLanguageColor(snippet.language) }}
                              />
                              <h4 className="font-medium text-sm truncate">
                                {snippet.title}
                              </h4>
                              {Number(snippet.isPublic) > 0 && (
                                <Eye className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {snippet.description || 'No description'}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {LANGUAGES.find(l => l.value === snippet.language)?.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(snippet.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex gap-1 ml-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(snippet.code);
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadSnippet(snippet);
                              }}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSnippet(snippet.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {snippets.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No code snippets yet</p>
                      <p className="text-sm">Create your first snippet!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-2 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getLanguageColor(language) }}
              />
              <span className="text-sm font-medium">
                {LANGUAGES.find(l => l.value === language)?.label}
              </span>
              {currentSnippet && (
                <Badge variant="outline" className="text-xs">
                  {currentSnippet.title}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(code)}
                disabled={!code.trim()}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (currentSnippet) {
                    downloadSnippet({ ...currentSnippet, code });
                  }
                }}
                disabled={!code.trim()}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 relative">
            <div 
              className="absolute inset-0 code-editor"
              style={{
                backgroundColor: currentTheme.bg,
                color: currentTheme.text,
                fontSize: `${fontSize}px`
              }}
            >
              <div className="flex h-full">
                {showLineNumbers && (
                  <div className="code-line-numbers flex-shrink-0 p-4 select-none">
                    {code.split('\n').map((_, index) => (
                      <div key={index} className="leading-6">
                        {index + 1}
                      </div>
                    ))}
                  </div>
                )}
                
                <Textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="// Start coding here..."
                  className="flex-1 border-0 bg-transparent resize-none font-mono leading-6 p-4"
                  style={{
                    fontSize: `${fontSize}px`,
                    color: currentTheme.text,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace"
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}