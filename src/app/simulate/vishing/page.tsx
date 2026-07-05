"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Shield, Phone, ArrowLeft, Loader2, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FeedbackPanel } from "@/components/simulations/feedback-panel";
import type { VishingScenario, DialogueStep } from "@/lib/scenario-engine";
import type { AdaptiveFeedback } from "@/lib/feedback-engine";

export default function VishingSimulationPage() {
  const router = useRouter();
  const [scenario, setScenario] = useState<VishingScenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<AdaptiveFeedback | null>(null);
  const [startTime] = useState(Date.now());

  // Transcript mode state
  const [selectedTacticLines, setSelectedTacticLines] = useState<number[]>([]);

  // Interactive mode state
  const [chatHistory, setChatHistory] = useState<{ speaker: string; text: string }[]>([]);
  const [currentStep, setCurrentStep] = useState<DialogueStep | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [outcomeFeedback, setOutcomeFeedback] = useState<string>("");

  const fetchScenario = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/scenarios/generate?type=vishing");
      const data = await res.json();
      setScenario(data.scenario);
      if (data.scenario.mode === "interactive" && data.scenario.dialogue) {
        const firstStep = data.scenario.dialogue.find((s: DialogueStep) => s.step === 1);
        if (firstStep) {
          setIsTyping(true);
          setTimeout(() => {
            setChatHistory([{ speaker: "caller", text: firstStep.caller_message! }]);
            setCurrentStep(firstStep);
            setIsTyping(false);
          }, 1500);
        }
      }
    } catch (err) {
      console.error("Failed to load scenario:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScenario();
  }, [fetchScenario]);

  const toggleTacticLine = (index: number) => {
    if (submitted) return;
    setSelectedTacticLines((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleTranscriptSubmit = async () => {
    if (!scenario || scenario.mode !== "transcript" || !scenario.transcript) return;
    const tacticLines = scenario.transcript
      .map((line, i) => (line.has_tactic ? i : -1))
      .filter((i) => i >= 0);
    const caught = selectedTacticLines.filter((i) => tacticLines.includes(i));
    const missed = tacticLines.filter((i) => !selectedTacticLines.includes(i));
    const isCorrect = caught.length >= tacticLines.length * 0.5;

    await submitResults(isCorrect, caught.length, missed.length);
  };

  const handleOptionSelect = (option: { id: string; text: string; score: string; leads_to: number }) => {
    if (!scenario || scenario.mode !== "interactive" || !scenario.dialogue) return;

    setChatHistory((prev) => [...prev, { speaker: "you", text: option.text }]);
    const nextStep = scenario.dialogue.find((s) => s.step === option.leads_to);

    if (nextStep?.outcome) {
      setOutcome(nextStep.outcome);
      setOutcomeFeedback(nextStep.feedback || "");
      setCurrentStep(null);
      const isCorrect = nextStep.outcome === "resisted";
      submitResults(isCorrect, 0, 0);
    } else if (nextStep?.caller_message) {
      setCurrentStep(null);
      setIsTyping(true);
      setTimeout(() => {
        setChatHistory((prev) => [...prev, { speaker: "caller", text: nextStep.caller_message! }]);
        setCurrentStep(nextStep);
        setIsTyping(false);
      }, 1500);
    }
  };

  const submitResults = async (isCorrect: boolean, caughtCount: number, missedCount: number) => {
    if (!scenario) return;
    const timeSpentMs = Date.now() - startTime;

    try {
      const res = await fetch("/api/scenarios/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: scenario.id,
          scenarioType: "vishing",
          difficulty: scenario.difficulty,
          decision: isCorrect ? "resisted" : "manipulated",
          isCorrect,
          flagsCaught: scenario.red_flags.slice(0, caughtCount).map((f) => f.id),
          flagsMissed: scenario.red_flags.slice(caughtCount).map((f) => f.id),
          tacticsUsed: scenario.manipulation_tactics,
          tacticsMissed: isCorrect ? [] : scenario.manipulation_tactics,
          timeSpentMs,
        }),
      });
      const data = await res.json();
      setFeedback(data.feedback);
    } catch {
      const { generateFeedback } = await import("@/lib/feedback-engine");
      const fb = generateFeedback({
        isCorrect,
        userFlagIds: scenario.red_flags.slice(0, caughtCount).map((f) => f.id),
        actualFlags: scenario.red_flags,
        scenarioType: "vishing",
        difficulty: scenario.difficulty,
      });
      setFeedback(fb);
    }
    setSubmitted(true);
  };

  const handleNext = () => {
    setScenario(null);
    setSelectedTacticLines([]);
    setChatHistory([]);
    setCurrentStep(null);
    setOutcome(null);
    setSubmitted(false);
    setFeedback(null);
    fetchScenario();
  };

  if (loading) {
    return (
      <div className="min-h-screen cyber-grid flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Generating vishing scenario...</p>
        </div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="min-h-screen cyber-grid flex items-center justify-center">
        <p className="text-destructive">Failed to load scenario.</p>
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
            <Phone className="h-5 w-5 text-primary" />
            <span className="font-semibold">Vishing Simulation</span>
            <span className="text-xs bg-secondary px-2 py-0.5 rounded">
              {"⭐".repeat(scenario.difficulty)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground capitalize bg-secondary px-2 py-1 rounded">
            {scenario.mode} mode
          </span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {!submitted ? (
          <>
            {/* Phone UI Header */}
            <Card className="rounded-3xl overflow-hidden mb-6">
              <div className="bg-secondary/80 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Active Call</span>
                </div>
                {scenario.duration && (
                  <span className="text-sm text-muted-foreground">{scenario.duration}</span>
                )}
              </div>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <PhoneCall className="h-8 w-8 text-primary" />
                </div>
                <p className="font-semibold">{scenario.caller_id}</p>
                <p className="text-sm text-muted-foreground">{scenario.caller_number}</p>
              </CardContent>
            </Card>

            {/* Transcript Mode */}
            {scenario.mode === "transcript" && scenario.transcript && (
              <>
                <Card className="mb-4 border-primary/20">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Instructions:</strong> Read the transcript and click on lines where you detect manipulation tactics.
                    </p>
                  </CardContent>
                </Card>

                <div className="space-y-3 mb-6">
                  {scenario.transcript.map((line, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex gap-3",
                        line.speaker === "you" ? "justify-end" : "justify-start"
                      )}
                    >
                      <button
                        onClick={() => line.speaker === "caller" ? toggleTacticLine(i) : undefined}
                        disabled={line.speaker === "you"}
                        className={cn(
                          "max-w-[85%] p-3 rounded-2xl text-left text-sm transition-all",
                          line.speaker === "caller" && "bg-secondary rounded-tl-sm cursor-pointer hover:ring-1 hover:ring-primary/50",
                          line.speaker === "you" && "bg-primary/10 border border-primary/30 rounded-tr-sm cursor-default",
                          selectedTacticLines.includes(i) && "ring-2 ring-destructive bg-destructive/10"
                        )}
                      >
                        <span className={cn(
                          "text-xs font-medium block mb-1",
                          line.speaker === "caller" ? "text-destructive" : "text-primary"
                        )}>
                          {line.speaker === "caller" ? "Caller" : "You"} • {line.timestamp}
                        </span>
                        {line.text}
                        {selectedTacticLines.includes(i) && (
                          <span className="text-xs text-destructive block mt-1">⚠️ Flagged as suspicious</span>
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                <Button onClick={handleTranscriptSubmit} className="w-full" size="lg">
                  Submit Analysis ({selectedTacticLines.length} lines flagged)
                </Button>
              </>
            )}

            {/* Interactive Mode */}
            {scenario.mode === "interactive" && (
              <div className="space-y-4">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.speaker === "you" ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[80%] p-4 rounded-2xl text-sm",
                      msg.speaker === "caller"
                        ? "bg-secondary rounded-tl-sm"
                        : "bg-primary/20 border border-primary/40 rounded-tr-sm"
                    )}>
                      <span className={cn(
                        "text-xs font-medium block mb-1",
                        msg.speaker === "caller" ? "text-destructive" : "text-primary"
                      )}>
                        {msg.speaker === "caller" ? "Caller" : "You"}
                      </span>
                      {msg.text}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-secondary rounded-2xl rounded-tl-sm p-4 flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}

                {outcome && (
                  <Card className={cn(
                    "border-2",
                    outcome === "resisted" ? "border-green-500/50 bg-green-500/5" : "border-destructive/50 bg-destructive/5"
                  )}>
                    <CardContent className="p-4 text-center">
                      <p className="font-bold text-lg mb-2">
                        {outcome === "resisted" ? "✅ You Resisted!" : "❌ You Were Manipulated"}
                      </p>
                      <p className="text-sm text-muted-foreground">{outcomeFeedback}</p>
                    </CardContent>
                  </Card>
                )}

                {currentStep?.options && !outcome && (
                  <div className="space-y-2 mt-4">
                    <p className="text-xs text-muted-foreground">Choose your response:</p>
                    {currentStep.options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleOptionSelect(opt)}
                        className="w-full text-left p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
                      >
                        <span className="text-sm">{opt.text}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <FeedbackPanel
            feedback={feedback}
            scenario={scenario}
            scenarioType="vishing"
            onNext={handleNext}
            onDashboard={() => router.push("/dashboard")}
          />
        )}
      </div>
    </div>
  );
}
