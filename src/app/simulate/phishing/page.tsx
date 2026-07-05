"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Shield, AlertTriangle, CheckCircle, Clock, Flag, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhishingEmailViewer } from "@/components/simulations/phishing-email-viewer";
import { FeedbackPanel } from "@/components/simulations/feedback-panel";
import type { PhishingScenario } from "@/lib/scenario-engine";
import type { AdaptiveFeedback } from "@/lib/feedback-engine";

export default function PhishingSimulationPage() {
  const router = useRouter();
  const [scenario, setScenario] = useState<PhishingScenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFlags, setSelectedFlags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<AdaptiveFeedback | null>(null);
  const [startTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);

  const fetchScenario = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/scenarios/generate?type=phishing");
      const data = await res.json();
      setScenario(data.scenario);
    } catch (err) {
      console.error("Failed to load scenario:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScenario();
  }, [fetchScenario]);

  useEffect(() => {
    if (!submitted) {
      const interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [submitted, startTime]);

  const toggleFlag = (flagId: string) => {
    if (submitted) return;
    setSelectedFlags((prev) =>
      prev.includes(flagId) ? prev.filter((f) => f !== flagId) : [...prev, flagId]
    );
  };

  const handleSubmit = async (decision: "phishing" | "safe") => {
    if (!scenario) return;
    const isCorrect = scenario.is_malicious ? decision === "phishing" : decision === "safe";
    const timeSpentMs = Date.now() - startTime;

    try {
      const res = await fetch("/api/scenarios/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: scenario.id,
          scenarioType: "phishing",
          difficulty: scenario.difficulty,
          decision,
          isCorrect,
          flagsCaught: selectedFlags,
          flagsMissed: scenario.red_flags.filter((f) => !selectedFlags.includes(f.id)).map((f) => f.id),
          tacticsUsed: scenario.manipulation_tactics,
          tacticsMissed: scenario.red_flags.filter((f) => !selectedFlags.includes(f.id)).map((f) => f.tactic),
          actualFlags: scenario.red_flags,
          timeSpentMs,
        }),
      });
      const data = await res.json();
      setFeedback(data.feedback);
    } catch {
      // Generate feedback client-side as fallback
      const { generateFeedback } = await import("@/lib/feedback-engine");
      const fb = generateFeedback({
        isCorrect,
        userFlagIds: selectedFlags,
        actualFlags: scenario.red_flags,
        scenarioType: "phishing",
        difficulty: scenario.difficulty,
      });
      setFeedback(fb);
    }
    setSubmitted(true);
  };

  const handleNextScenario = () => {
    setScenario(null);
    setSelectedFlags([]);
    setSubmitted(false);
    setFeedback(null);
    fetchScenario();
  };

  if (loading) {
    return (
      <div className="min-h-screen cyber-grid flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Generating phishing scenario...</p>
        </div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="min-h-screen cyber-grid flex items-center justify-center">
        <p className="text-destructive">Failed to load scenario. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-grid">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold">Phishing Simulation</span>
            <span className="text-xs bg-secondary px-2 py-0.5 rounded">
              Difficulty: {"⭐".repeat(scenario.difficulty)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, "0")}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {!submitted ? (
          <>
            {/* Instructions */}
            <Card className="mb-6 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Flag className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Inspect this email carefully</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click on suspicious elements to flag them, then decide if this email is a phishing attempt or legitimate.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Viewer */}
            <PhishingEmailViewer
              scenario={scenario}
              selectedFlags={selectedFlags}
              onToggleFlag={toggleFlag}
            />

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => handleSubmit("phishing")}
                className="flex-1 bg-destructive hover:bg-destructive/90"
                size="lg"
              >
                <AlertTriangle className="h-5 w-5 mr-2" />
                Report as Phishing
              </Button>
              <Button
                onClick={() => handleSubmit("safe")}
                variant="outline"
                className="flex-1 border-green-600 text-green-500 hover:bg-green-600/10"
                size="lg"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Mark as Safe
              </Button>
            </div>

            {selectedFlags.length > 0 && (
              <p className="text-sm text-muted-foreground text-center mt-3">
                {selectedFlags.length} red flag{selectedFlags.length !== 1 ? "s" : ""} identified
              </p>
            )}
          </>
        ) : (
          <FeedbackPanel
            feedback={feedback}
            scenario={scenario}
            scenarioType="phishing"
            onNext={handleNextScenario}
            onDashboard={() => router.push("/dashboard")}
          />
        )}
      </div>
    </div>
  );
}
