"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart3, 
  MessageSquare, 
  Users, 
  Zap, 
  RefreshCw, 
  Calendar,
  TrendingUp,
  Database,
  LogOut,
  Eye,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface ChatStats {
  total_conversations: number;
  total_messages: number;
  total_tokens: number;
  avg_messages_per_conversation: number;
  conversations_today: number;
  tokens_today: number;
}

interface Conversation {
  id: string;
  created_at: string;
  user_session_id?: string;
  total_messages?: number;
  total_tokens?: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  token_count: number;
  created_at: string;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchStats();
    fetchConversations();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/admin/login");
    } else {
      setUser(user);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/admin/conversations");
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`/api/admin/conversations/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        setSelectedConversation(conversationId);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleScrape = async () => {
    setIsScraping(true);
    try {
      const response = await fetch("/api/scrape");
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Scrape Successful",
          description: `Indexed ${data.totalChunks} chunks from ${data.processedPages.length} pages`,
        });
      } else {
        toast({
          title: "Scrape Failed",
          description: data.details || "An error occurred during scraping",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Scrape Error",
        description: "Failed to run scrape operation",
        variant: "destructive",
      });
    } finally {
      setIsScraping(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const filteredConversations = conversations.filter(conv => 
    conv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.user_session_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-600">Monitor chatbot usage and manage content</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="px-3 py-1">
              {user.email}
            </Badge>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : stats?.total_conversations || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.conversations_today || 0} today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : stats?.total_messages || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg {stats?.avg_messages_per_conversation || 0} per conversation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : (stats?.total_tokens || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {(stats?.tokens_today || 0).toLocaleString()} today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Content Management</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleScrape} 
                disabled={isScraping}
                className="w-full"
                size="sm"
              >
                {isScraping ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Run Scrape
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversations List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Recent Conversations
              </CardTitle>
              <CardDescription>
                Click on a conversation to view messages
              </CardDescription>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {isLoadingConversations ? (
                  <div className="text-center py-4 text-slate-500">Loading conversations...</div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-4 text-slate-500">No conversations found</div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => fetchMessages(conversation.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedConversation === conversation.id
                          ? "bg-blue-50 border-blue-200"
                          : "bg-white hover:bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">
                            {conversation.id.slice(0, 8)}...
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(conversation.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="text-xs">
                            {conversation.total_messages || 0} msgs
                          </Badge>
                          <p className="text-xs text-slate-500 mt-1">
                            {(conversation.total_tokens || 0).toLocaleString()} tokens
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Messages View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Conversation Messages
              </CardTitle>
              <CardDescription>
                {selectedConversation 
                  ? `Viewing conversation ${selectedConversation.slice(0, 8)}...`
                  : "Select a conversation to view messages"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {isLoadingMessages ? (
                  <div className="text-center py-4 text-slate-500">Loading messages...</div>
                ) : !selectedConversation ? (
                  <div className="text-center py-8 text-slate-500">
                    Select a conversation from the list to view its messages
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-4 text-slate-500">No messages found</div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-blue-50 border-l-4 border-blue-400"
                          : "bg-slate-50 border-l-4 border-slate-400"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Badge 
                          variant={message.role === "user" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {message.role}
                        </Badge>
                        <div className="text-right">
                          <span className="text-xs text-slate-500">
                            {message.token_count} tokens
                          </span>
                          <p className="text-xs text-slate-400">
                            {formatDate(message.created_at)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}