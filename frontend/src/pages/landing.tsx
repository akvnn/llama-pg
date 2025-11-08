import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Zap,
  Database,
  Workflow,
  Code,
  Shield,
  ChevronRight,
  Layers,
  ArrowRight,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import LlamaLogo from "@/assets/LlamaLogo";
import GithubIcon from "@/components/app/layout/github-icon";

export default function Landing() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const features = [
    {
      icon: FileText,
      title: "PDF Processing",
      description:
        "Automatic PDF parsing using LlamaParse with configurable auto-mode for intelligent document extraction",
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      icon: Zap,
      title: "Vector Embeddings",
      description:
        "Built-in support for vLLM embeddings or OpenAI embeddings for high-performance semantic search",
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      icon: Layers,
      title: "Admin Interface",
      description:
        "Easy-to-use admin panel for document management, monitoring, and configuration",
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      icon: Code,
      title: "REST API",
      description:
        "Simple and powerful API endpoints for document insertion, retrieval, and RAG operations",
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
    {
      icon: Workflow,
      title: "Worker Architecture",
      description:
        "Scalable background processing with ARQ workers for handling large-scale document pipelines",
      color: "text-chart-5",
      bgColor: "bg-chart-5/10",
    },
    {
      icon: Database,
      title: "pgai Integration",
      description:
        "Leverages TimescaleDB's pgai extension for advanced vector operations and storage",
      color: "text-chart-6",
      bgColor: "bg-chart-6/10",
    },
  ];

  const pipeline = [
    { step: "Upload", label: "PDF Upload", icon: FileText },
    { step: "Queue", label: "Queued in Redis", icon: Layers },
    { step: "Parse", label: "Document Parsing", icon: FileText },
    { step: "Store", label: "Stored in PostgreSQL", icon: Database },
    { step: "Vectorize", label: "Vector Embeddings", icon: Zap },
    { step: "Ready", label: "Ready for Search", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-16 w-16 rounded-lg flex items-center justify-center p-1.5">
              <LlamaLogo theme={theme} />
            </div>
            <span className="font-bold text-xl">LlamaPG</span>
          </div>
          <div className="flex items-center gap-2">
            <GithubIcon />
            <Button
              onClick={toggleTheme}
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={() => navigate("/login")}
              variant="default"
              className="hover:cursor-pointer"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        <section className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="outline" className="px-4 py-1">
              Production-Ready RAG as a Service
            </Badge>
            <h1 className="text-4xl md:text-6xl py-4 font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Transform Documents into
              <br />
              Intelligent Search
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A powerful orchestrator for intelligent document parsing, vector embedding generation, and retrieval-augmented generation—enabling you to automate embeddings across all your projects in one place
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/dashboard")}
                className="gap-2 hover:cursor-pointer"
              >
                Get Started
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() =>
                  window.open("https://github.com/akvnn/llama-pg", "_blank")
                }
                className="gap-2 hover:cursor-pointer"
              >
                View Documentation
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Features
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need for production-ready document processing and
              semantic search
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
                >
                  <CardHeader>
                    <div
                      className={`h-12 w-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}
                    >
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="container mx-auto px-4 py-20 bg-muted/30 rounded-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Seamless Processing Pipeline
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From PDF upload to searchable embeddings in a fully automated
              workflow
            </p>
          </div>
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {pipeline.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                        <Icon className="h-7 w-7 text-primary" />
                      </div>
                      {index < pipeline.length - 1 && (
                        <div className="hidden lg:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                      )}
                    </div>
                    <div className="mt-4 text-center">
                      <div className="text-xs font-semibold text-primary mb-1">
                        {item.step}
                      </div>
                      <div className="text-sm font-medium">{item.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <Card className="border-2 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader className="text-center py-16">
              <CardTitle className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Get Started?
              </CardTitle>
              <CardDescription className="text-lg mb-8 max-w-2xl mx-auto">
                Start processing documents and building intelligent search
                experiences today
              </CardDescription>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => navigate("/dashboard")}
                  className="gap-2"
                >
                  Launch Dashboard
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </Button>
              </div>
            </CardHeader>
          </Card>
        </section>
      </div>
    </div>
  );
}
