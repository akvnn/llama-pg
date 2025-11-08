import { useState } from "react";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useOrganizationStore } from "@/hooks/use-organization";
import { useProjectStore } from "@/hooks/use-project";
import axiosInstance from "@/axios";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { SearchResult } from "@/types/search.types";

export default function Search() {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(3);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentOrganization = useOrganizationStore(
    (state) => state.currentOrganization
  );
  const currentProject = useProjectStore((state) => state.currentProject);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query || !currentOrganization || !currentProject) {
      setError("Please select an organization and project first");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.post<{ data: SearchResult[] }>(
        "/search",
        {
          query,
          limit,
          organization_id: currentOrganization,
          project_id: currentProject,
        }
      );
      setResults(response.data.data);
    } catch (err: any) {
      console.error("Search failed:", err);
      setError(err.response?.data?.message || "Failed to perform search");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Search</h1>
        <p className="text-muted-foreground">
          Find relevant chunks from your documents using semantic search
        </p>
      </div>

      {!currentProject && (
        <Alert>
          <AlertDescription>
            Please select a project from the sidebar to start searching
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Search Query</CardTitle>
          <CardDescription>
            Enter your search query to find relevant document chunks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="query">Query</Label>
              <Input
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your search query..."
                disabled={!currentProject}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="limit">Number of Results</Label>
              <Input
                id="limit"
                type="number"
                min="1"
                max="20"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                disabled={!currentProject}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" disabled={loading || !currentProject}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <SearchIcon className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Results</h2>
          {results.map((result, index) => (
            <Card key={`${result.id}-${index}`}>
              <CardHeader>
                <CardTitle className="text-lg">{result.title}</CardTitle>
                <CardDescription>
                  Chunk {result.chunk} • Distance: {result.distance.toFixed(4)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{result.text}</p>
                {Object.keys(result.metadata).length > 0 && (
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <p className="text-xs font-semibold mb-2">Metadata:</p>
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(result.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
