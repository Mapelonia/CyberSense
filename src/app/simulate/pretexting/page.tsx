'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Shield, MessageSquare, ArrowLeft, Loader2, User, Bot } from 'lucide-react'
import { FeedbackPanel } from '@/components/simulations/feedback-panel'

interface DialogueOption {
  id: string
  text: string
  score: 'comply' | 'partial' | 'resist'
  leads_to: string
}

interface DialogueStep {
  id: string
  message: string
  options?: DialogueOption[]
  outcome?: 'resisted' | 'manipulated'
}

interface Scenario {
  id: string
  title: string
  context: string
  difficulty: number
  tacticsUsed: string[]
  dialogue: {
    steps: Record<string, DialogueStep>
    start: string
  }
}

interface ChatMessage {
  id: string
  type: 'attacker' | 'user'
  text: string
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 bg-secondary rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
      <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:0ms]" />
      <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:150ms]" />
      <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:300ms]" />
    </div>
  )
}

export default function PretextingSimulationPage() {
  const router = useRouter()
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentStepId, setCurrentStepId] = useState<string | null>(null)
  const [currentOptions, setCurrentOptions] = useState<DialogueOption[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [outcome, setOutcome] = useState<'resisted' | 'manipulated' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackData, setFeedbackData] = useState<any>(null)
  const [startTime] = useState(Date.now())
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchScenario()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  async function fetchScenario() {
    try {
      setLoading(true)
      const res = await fetch('/api/scenarios/generate?type=pretexting')
      const data = await res.json()
      setScenario(data)
      // Start the dialogue
      const startStepId = data.dialogue.start
      setCurrentStepId(startStepId)
      presentStep(data, startStepId)
    } catch (error) {
      console.error('Failed to fetch scenario:', error)
    } finally {
      setLoading(false)
    }
  }

  function presentStep(scenarioData: Scenario, stepId: string) {
    const step = scenarioData.dialogue.steps[stepId]
    if (!step) return

    // Show typing indicator then attacker message
    setIsTyping(true)
    setCurrentOptions([])

    setTimeout(() => {
      setIsTyping(false)
      setMessages((prev) => [
        ...prev,
        { id: `attacker-${stepId}`, type: 'attacker', text: step.message },
      ])

      if (step.outcome) {
        // End state reached
        setOutcome(step.outcome)
        submitResults(scenarioData, step.outcome)
      } else if (step.options && step.options.length > 0) {
        setCurrentOptions(step.options)
      }
    }, 1500)
  }

  function handleOptionSelect(option: DialogueOption) {
    // Add user message
    setMessages((prev) => [
      ...prev,
      { id: `user-${option.id}`, type: 'user', text: option.text },
    ])
    setCurrentOptions([])

    // Follow leads_to
    if (scenario) {
      const nextStepId = option.leads_to
      setCurrentStepId(nextStepId)
      presentStep(scenario, nextStepId)
    }
  }

  async function submitResults(scenarioData: Scenario, finalOutcome: 'resisted' | 'manipulated') {
    setSubmitting(true)
    try {
      const timeSpentMs = Date.now() - startTime
      const payload = {
        scenarioId: scenarioData.id,
        scenarioType: 'pretexting',
        difficulty: scenarioData.difficulty,
        decision: finalOutcome,
        isCorrect: finalOutcome === 'resisted',
        flagsCaught: [],
        flagsMissed: [],
        tacticsUsed: scenarioData.tacticsUsed,
        tacticsMissed: [],
        timeSpentMs,
      }

      const res = await fetch('/api/scenarios/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      setFeedbackData(data)
      setShowFeedback(true)
    } catch (error) {
      console.error('Failed to submit results:', error)
      // Still show feedback even if submission fails
      setShowFeedback(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background cyber-grid flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading pretexting scenario...</p>
        </div>
      </div>
    )
  }

  if (!scenario) {
    return (
      <div className="min-h-screen bg-background cyber-grid flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Shield className="w-8 h-8 text-destructive" />
          <p className="text-muted-foreground">Failed to load scenario.</p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background cyber-grid flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold">Pretexting Simulation</h1>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'text-sm',
                  i < scenario.difficulty ? 'text-primary' : 'text-muted-foreground/30'
                )}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col max-w-3xl">
        {/* Context Card */}
        <Card className="mb-6 bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <h2 className="font-medium text-sm text-primary mb-1">Scenario Context</h2>
                <p className="text-sm text-muted-foreground">{scenario.context}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto mb-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex', msg.type === 'attacker' ? 'justify-start' : 'justify-end')}
            >
              <div className="flex items-end gap-2 max-w-[80%]">
                {msg.type === 'attacker' && (
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    'px-4 py-3 text-sm',
                    msg.type === 'attacker'
                      ? 'bg-secondary rounded-2xl rounded-tl-sm'
                      : 'bg-primary/20 border border-primary/40 rounded-2xl rounded-tr-sm'
                  )}
                >
                  {msg.text}
                </div>
                {msg.type === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-muted-foreground" />
                </div>
                <TypingIndicator />
              </div>
            </div>
          )}

          {/* Outcome display */}
          {outcome && !showFeedback && (
            <div className="flex justify-center my-4">
              <Card
                className={cn(
                  'border',
                  outcome === 'resisted'
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-destructive/50 bg-destructive/10'
                )}
              >
                <CardContent className="p-4 text-center">
                  <Shield
                    className={cn(
                      'w-8 h-8 mx-auto mb-2',
                      outcome === 'resisted' ? 'text-primary' : 'text-destructive'
                    )}
                  />
                  <p className="font-semibold text-lg">
                    {outcome === 'resisted'
                      ? 'You Resisted the Attack!'
                      : 'You Were Manipulated'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {outcome === 'resisted'
                      ? 'Great job! You identified the social engineering attempt.'
                      : 'The attacker successfully manipulated you. Learn from this experience.'}
                  </p>
                  {submitting && (
                    <div className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving results...
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Response Options */}
        {currentOptions.length > 0 && !outcome && (
          <div className="flex flex-col gap-2 mt-auto pb-4">
            <p className="text-xs text-muted-foreground mb-1">Choose your response:</p>
            {currentOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option)}
                className="w-full text-left p-4 border border-border hover:border-primary/50 hover:bg-primary/5 rounded-xl transition-colors text-sm"
              >
                {option.text}
              </button>
            ))}
          </div>
        )}

        {/* Feedback Panel */}
        {showFeedback && feedbackData && (
          <div className="mt-4 pb-6">
            <FeedbackPanel data={feedbackData} />
          </div>
        )}
      </main>
    </div>
  )
}
