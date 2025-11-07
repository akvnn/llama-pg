import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

export default function GithubIcon() {
  return (
    <Button
      onClick={() =>
        window.open("https://github.com/akvnn/llama-pg", "_blank")
      }
      variant="ghost"
      size="icon"
      className="h-10 w-10 hover:cursor-pointer"
      aria-label="View GitHub repository"
    >
      <Github className="h-4 w-4" />
    </Button>
  );
}
