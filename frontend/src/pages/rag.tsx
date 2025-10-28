import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useOrganizationStore } from "@/hooks/use-organization";
import { useProjectStore } from "@/hooks/use-project";
import axiosInstance from "@/axios";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function RAG() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentOrganization = useOrganizationStore(
    (state) => state.currentOrganization
  );
  const currentProject = useProjectStore((state) => state.currentProject);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentOrganization || !currentProject) {
      setError("Please select an organization and project first");
      return;
    }

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError(null);

    try {
      setLoading(true);
      const result = await axiosInstance.post<{ data: string }>("/rag", {
        query: input,
        limit,
        organization_id: currentOrganization,
        project_id: currentProject,
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: result.data.data,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error("RAG query failed:", err);
      setError(err.response?.data?.message || "Failed to perform RAG query");
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error processing your request.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-6 gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">RAG Chat</h1>
          <p className="text-muted-foreground">
            Ask questions about your documents
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chat Settings</DialogTitle>
              <DialogDescription>
                Configure the RAG chat behavior
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="limit">Context Chunks</Label>
                <Input
                  id="limit"
                  type="number"
                  min="1"
                  max="20"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Number of relevant document chunks to use for context
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!currentProject && (
        <Alert>
          <AlertDescription>
            Please select a project from the sidebar to start chatting
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm">
                  Start by asking a question about your documents
                </p>
              </div>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={!currentProject || loading}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!currentProject || loading || !input.trim()}
              size="icon"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
