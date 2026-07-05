"use client";

import { CheckCircle, XCircle, AlertTriangle, ArrowRight, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { AdaptiveFeedback } from "@/lib/feedback-engine";
import type { Scenario } from "@/lib/scenario-engine";

interface Props {
  feedback: AdaptiveFeedback | null;
  scenario: Scenario;
  scenarioType: string;
  onNext: () => void;
  onDashboard: () => void;
}

export function FeedbackPanel({ feedback, scenario, scenarioType, onNext, onDashboard }: Props) {
  if (!feedback) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Processing your results...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Result Banner */}
      <Card className={cn(
        "border-2",
        feedback.isCorrect ? "border-green-500/50 bg-green-500/5" : "border-destructive/50 bg-destructive/5"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {feedback.isCorrect ? (
              <CheckCircle className="h-12 w-12 text-green-500 shrink-0" />
            ) : (
              <XCircle className="h-12 w-12 text-destructive shrink-0" />
            )}
            <div>
              <h2 className="text-xl font-bold">
                {feedback.isCorrect ? "Correct!" : "Incorrect"}
              </h2>
              <p className="text-muted-foreground mt-1">{feedback.summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detection Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={feedback.score} className="h-3" />
            </div>
            <span className="text-2xl font-bold text-primary">{feedback.score}%</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{feedback.encouragement}</p>
        </CardContent>
      </Card>

      {/* Red Flags Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Red Flags Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {feedback.items.map((item, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border",
                item.caught ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"
              )}
            >
              {item.caught ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    item.caught ? "bg-green-500/20 text-green-400" : "bg-destructive/20 text-red-400"
                  )}>
                    {item.caught ? "Caught" : "Missed"}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {item.flag.tactic} tactic
                  </span>
                </div>
                <p className="text-sm mt-1">{item.flag.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Personalized Tips */}
      {feedback.personalizedTips.length > 0 && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Personalized Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {feedback.personalizedTips.map((tip, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={onNext} className="flex-1" size="lg">
          Next Scenario
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <Button onClick={onDashboard} variant="outline" size="lg">
          <LayoutDashboard className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
      </div>
    </div>
  );
}
