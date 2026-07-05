"use client";

import { Mail, Paperclip, Flag } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PhishingScenario } from "@/lib/scenario-engine";

interface Props {
  scenario: PhishingScenario;
  selectedFlags: string[];
  onToggleFlag: (flagId: string) => void;
  showAllFlags?: boolean;
}

export function PhishingEmailViewer({ scenario, selectedFlags, onToggleFlag, showAllFlags }: Props) {
  const flagLocations = scenario.red_flags.reduce((acc, flag) => {
    acc[flag.location || ""] = flag;
    return acc;
  }, {} as Record<string, typeof scenario.red_flags[0]>);

  const isFlagged = (location: string) => {
    const flag = flagLocations[location];
    return flag ? selectedFlags.includes(flag.id) : false;
  };

  const getFlagId = (location: string) => flagLocations[location]?.id;

  const isHighlighted = (location: string) => {
    if (!showAllFlags) return false;
    return !!flagLocations[location];
  };

  return (
    <Card className="overflow-hidden">
      {/* Email Header */}
      <CardHeader className="bg-secondary/50 border-b border-border p-4">
        <div className="space-y-2">
          {/* From */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-12">From:</span>
            <button
              onClick={() => getFlagId("sender_email") && onToggleFlag(getFlagId("sender_email")!)}
              className={cn(
                "text-sm px-2 py-0.5 rounded transition-all cursor-pointer hover:bg-destructive/10",
                isFlagged("sender_email") && "bg-destructive/20 ring-1 ring-destructive",
                isHighlighted("sender_email") && "bg-yellow-500/20 ring-1 ring-yellow-500"
              )}
            >
              <span className="font-medium">{scenario.sender_name}</span>
              <span className="text-muted-foreground ml-1">&lt;{scenario.sender_email}&gt;</span>
              {isFlagged("sender_email") && <Flag className="inline h-3 w-3 ml-1 text-destructive" />}
            </button>
          </div>

          {/* Subject */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-12">Subject:</span>
            <button
              onClick={() => getFlagId("subject") && onToggleFlag(getFlagId("subject")!)}
              className={cn(
                "text-sm font-semibold px-2 py-0.5 rounded transition-all cursor-pointer hover:bg-destructive/10",
                isFlagged("subject") && "bg-destructive/20 ring-1 ring-destructive",
                isHighlighted("subject") && "bg-yellow-500/20 ring-1 ring-yellow-500"
              )}
            >
              {scenario.subject}
              {isFlagged("subject") && <Flag className="inline h-3 w-3 ml-1 text-destructive" />}
            </button>
          </div>

          {/* To */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-12">To:</span>
            <span className="text-sm text-muted-foreground">you@example.com</span>
          </div>
        </div>
      </CardHeader>

      {/* Email Body */}
      <CardContent className="p-6">
        <div className="prose prose-invert prose-sm max-w-none">
          {scenario.body.split("\n").map((line, i) => {
            // Check if line contains a link
            const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
            // Check if line has flaggable content
            const hasDeadline = line.toLowerCase().includes("hour") || line.toLowerCase().includes("immediately") || line.toLowerCase().includes("today");
            const hasLink = !!linkMatch;
            const hasConsequence = line.toLowerCase().includes("suspend") || line.toLowerCase().includes("disrupt") || line.toLowerCase().includes("arrest");
            const hasAuthority = line.toLowerCase().includes("management") || line.toLowerCase().includes("mandatory") || line.toLowerCase().includes("required");

            let flagLocation = "";
            if (hasLink) flagLocation = "body_link";
            else if (hasDeadline) flagLocation = "body_deadline";
            else if (hasConsequence) flagLocation = "body_consequence";
            else if (hasAuthority) flagLocation = "body_authority";

            const flagId = getFlagId(flagLocation);
            const flagged = isFlagged(flagLocation);
            const highlighted = isHighlighted(flagLocation);

            if (line.trim() === "") return <br key={i} />;

            if (linkMatch) {
              return (
                <p key={i} className="my-2">
                  <button
                    onClick={() => flagId && onToggleFlag(flagId)}
                    className={cn(
                      "text-blue-400 underline px-1 py-0.5 rounded transition-all cursor-pointer hover:bg-destructive/10",
                      flagged && "bg-destructive/20 ring-1 ring-destructive",
                      highlighted && "bg-yellow-500/20 ring-1 ring-yellow-500"
                    )}
                  >
                    {linkMatch[1]}
                    {flagged && <Flag className="inline h-3 w-3 ml-1 text-destructive" />}
                  </button>
                  <span className="text-xs text-muted-foreground block mt-1 font-mono">
                    {linkMatch[2]}
                  </span>
                </p>
              );
            }

            if (flagId) {
              return (
                <p key={i} className="my-2">
                  <button
                    onClick={() => onToggleFlag(flagId)}
                    className={cn(
                      "text-left px-1 py-0.5 rounded transition-all cursor-pointer hover:bg-destructive/10",
                      flagged && "bg-destructive/20 ring-1 ring-destructive",
                      highlighted && "bg-yellow-500/20 ring-1 ring-yellow-500"
                    )}
                  >
                    {line}
                    {flagged && <Flag className="inline h-3 w-3 ml-1 text-destructive" />}
                  </button>
                </p>
              );
            }

            return <p key={i} className="my-2">{line}</p>;
          })}
        </div>
      </CardContent>
    </Card>
  );
}
