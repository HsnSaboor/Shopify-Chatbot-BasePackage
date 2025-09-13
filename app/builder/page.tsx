"use client"

import { useState } from "react"
import { ChatbotWidget } from "@/components/chatbot-widget"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function BuilderPage() {
  const [config, setConfig] = useState({
    headerBackgroundColor: "#2563eb",
    headerBackgroundGradient: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    agentName: "AI Shopping Assistant",
    chatbotTagline: "Online & Ready to Help",
    avatarImageUrl: "",
    messageBackgroundColor: "#2563eb",
    messageBackgroundGradient: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    chatbotApiUrl: "https://shopify-ai-chatbot-v2.vercel.app",
    floatingButtonColor: "#2563eb",
  });

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
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Chatbot Builder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Header Background Color</Label>
              <Input name="headerBackgroundColor" value={config.headerBackgroundColor} onChange={handleConfigChange} />
            </div>
            <div>
              <Label>Header Background Gradient</Label>
              <Input name="headerBackgroundGradient" value={config.headerBackgroundGradient} onChange={handleConfigChange} />
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
              <Label>Message Bubble Background Color</Label>
              <Input name="messageBackgroundColor" value={config.messageBackgroundColor} onChange={handleConfigChange} />
            </div>
            <div>
              <Label>Message Bubble Background Gradient</Label>
              <Input name="messageBackgroundGradient" value={config.messageBackgroundGradient} onChange={handleConfigChange} />
            </div>
            <div>
              <Label>Chatbot API URL</Label>
              <Input name="chatbotApiUrl" value={config.chatbotApiUrl} onChange={handleConfigChange} />
            </div>
            <div>
              <Label>Floating Button Color</Label>
              <Input name="floatingButtonColor" value={config.floatingButtonColor} onChange={handleConfigChange} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-4 bg-gray-100 rounded-md overflow-x-auto">
              {JSON.stringify(config, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
      <div>
        <ChatbotWidget isPreview={true} {...config} />
      </div>
    </div>
  );
}
