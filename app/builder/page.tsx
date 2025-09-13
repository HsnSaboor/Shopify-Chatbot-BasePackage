"use client"

import { useState, useEffect } from "react"
import { ChatbotWidget } from "@/components/chatbot-widget"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import ColorPicker from 'react-best-gradient-color-picker'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover" // Import Popover components
import { Button } from "@/components/ui/button" // Import Button for PopoverTrigger
import { Paintbrush } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function BuilderPage() {
  const [config, setConfig] = useState({
    headerBackgroundColor: "#2563eb",
    headerBackgroundGradient: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    agentName: "AI Shopping Assistant",
    chatbotTagline: "Online & Ready to Help",
    avatarImageUrl: "",
    avatarBorderRadius: 50, // Default to 50% for circular
    avatarBorderWidth: 2,
    avatarBorderColor: "#000000",
    messageBackgroundColor: "#2563eb",
    messageBackgroundGradient: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    chatbotApiUrl: "https://shopify-ai-chatbot-v2.vercel.app",
    floatingButtonColor: "#2563eb",
    n8nWebhookUrl: "",
  });
  const [filename, setFilename] = useState("default");
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedConfig = localStorage.getItem('chatbotConfig');
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatbotConfig', JSON.stringify(config));
    }
  }, [config]);

  const saveConfigToFile = async () => {
    if (!filename.trim()) {
      toast({
        title: "Error",
        description: "Please enter a filename.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch(`/api/config/${filename}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });
      if (response.ok) {
        toast({
          title: "Success",
          description: `Configuration saved to ${filename}.json`,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to save configuration.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving config:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving.",
        variant: "destructive",
      });
    }
  };

  const loadConfigFromFile = async () => {
    if (!filename.trim()) {
      toast({
        title: "Error",
        description: "Please enter a filename.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch(`/api/config/${filename}`);
      if (response.ok) {
        const loadedConfig = await response.json();
        setConfig(loadedConfig);
        toast({
          title: "Success",
          description: `Configuration loaded from ${filename}.json`,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to load configuration.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading config:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading.",
        variant: "destructive",
      });
    }
  };

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig(prev => ({ ...prev, avatarImageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 p-8">
      <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-64px)]">
        <Card>
          <CardHeader>
            <CardTitle>Chatbot Builder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Header Background Color</Label>
              <Input type="color" name="headerBackgroundColor" value={config.headerBackgroundColor} onChange={handleConfigChange} className="h-10 w-full" />
            </div>
            <div>
              <Label>Header Background Gradient</Label>
              <div>
                <ColorPicker
                  value={config.headerBackgroundGradient}
                  onChange={(value) => setConfig(prev => ({ ...prev, headerBackgroundGradient: value }))}
                />
              </div>
            </div>
            <div>
              <Label>Agent Name</Label>
              <Input name="agentName" value={config.agentName} onChange={handleConfigChange} />
            </div>
            <div>
              <Label>Chatbot Tagline</Label>
              <Input name="chatbotTagline" value={config.chatbotTagline} onChange={handleConfigChange} />
            </div>
            <div>
              <Label>Avatar Image</Label>
              <Input type="file" accept="image/*" onChange={handleImageUpload} />
            </div>
            <div>
              <Label>Avatar Border Radius (%)</Label>
              <Input
                type="number"
                name="avatarBorderRadius"
                value={config.avatarBorderRadius}
                onChange={handleConfigChange}
                min="0"
                max="50"
              />
            </div>
            <div>
              <Label>Avatar Border Width (px)</Label>
              <Input
                type="number"
                name="avatarBorderWidth"
                value={config.avatarBorderWidth}
                onChange={handleConfigChange}
                min="0"
              />
            </div>
            <div>
              <Label>Avatar Border Color</Label>
              <Input
                type="color"
                name="avatarBorderColor"
                value={config.avatarBorderColor}
                onChange={handleConfigChange}
              />
            </div>
            <div>
              <Label>Message Bubble Background Color</Label>
              <Input type="color" name="messageBackgroundColor" value={config.messageBackgroundColor} onChange={handleConfigChange} className="h-10 w-full" />
            </div>
            <div>
              <Label>Message Bubble Background Gradient</Label>
              <div>
                <ColorPicker
                  value={config.messageBackgroundGradient}
                  onChange={(value) => setConfig(prev => ({ ...prev, messageBackgroundGradient: value }))}
                />
              </div>
            </div>
            <div>
              <Label>Chatbot API URL</Label>
              <Input name="chatbotApiUrl" value={config.chatbotApiUrl} onChange={handleConfigChange} />
            </div>
            <div>
              <Label>Floating Button Color</Label>
              <Input type="color" name="floatingButtonColor" value={config.floatingButtonColor} onChange={handleConfigChange} className="h-10 w-full" />
            </div>
            <div>
              <Label>n8n Webhook URL</Label>
              <Input name="n8nWebhookUrl" value={config.n8nWebhookUrl} onChange={handleConfigChange} placeholder="Enter your n8n webhook URL" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="p-4 bg-gray-100 rounded-md overflow-x-auto w-full h-64 font-mono text-sm"
              value={JSON.stringify(config, null, 2)}
              onChange={(e) => {
                try {
                  const parsedConfig = JSON.parse(e.target.value);
                  setConfig(parsedConfig);
                } catch (error) {
                  console.error("Invalid JSON config:", error);
                  // Optionally, provide user feedback about invalid JSON
                }
              }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>File Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="configFilename">Config Filename</Label>
              <Input
                id="configFilename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="e.g., my-chatbot-config"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveConfigToFile} disabled={!filename.trim()}>
                Save Config
              </Button>
              <Button onClick={loadConfigFromFile} disabled={!filename.trim()}>
                Load Config
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <div>
        <ChatbotWidget isPreview={true} {...config} />
      </div>
    </div>
  );
}