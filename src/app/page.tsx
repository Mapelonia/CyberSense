import Link from "next/link";
import { Shield, Mail, Phone, MessageSquare, Trophy, Brain } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen cyber-grid">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold glow-text">CyberSense</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm text-primary">Free Training Platform</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Train Your
            <span className="text-primary glow-text"> Cyber Instincts</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Practice identifying phishing emails, social engineering calls, and
            manipulation tactics in a safe, gamified environment. Build real
            resilience against cyber threats.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-all glow-green"
            >
              Start Training Free
            </Link>
            <Link
              href="#features"
              className="border border-border px-8 py-3 rounded-lg font-semibold text-lg hover:bg-secondary transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Three Attack Simulations
        </h2>
        <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
          Experience realistic social engineering scenarios and learn to identify
          manipulation tactics before they compromise you in real life.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Mail className="h-8 w-8" />}
            title="Phishing Emails"
            description="Inspect simulated emails and identify red flags — suspicious links, urgency tactics, spoofed senders, and more."
          />
          <FeatureCard
            icon={<MessageSquare className="h-8 w-8" />}
            title="Pretexting Chats"
            description="Navigate social engineering conversations where attackers try to manipulate you into giving up sensitive information."
          />
          <FeatureCard
            icon={<Phone className="h-8 w-8" />}
            title="Vishing Calls"
            description="Analyze phone call transcripts and participate in interactive voice scenarios to spot manipulation in real-time."
          />
        </div>
      </section>

      {/* Gamification Section */}
      <section className="container mx-auto px-4 py-24 border-t border-border/50">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Level Up Your Security Awareness
            </h2>
            <p className="text-muted-foreground mb-8">
              Every scenario you complete earns XP, builds streaks, and unlocks
              badges. Compete on the leaderboard and track your progress from
              Beginner to Expert.
            </p>
            <div className="space-y-4">
              <GamificationItem
                icon={<Trophy className="h-5 w-5 text-yellow-500" />}
                title="XP & Levels"
                description="Earn points scaled by difficulty. Progress through 5 ranks."
              />
              <GamificationItem
                icon={<Brain className="h-5 w-5 text-purple-400" />}
                title="Adaptive Feedback"
                description="Get personalized tips based on the tactics you miss most."
              />
              <GamificationItem
                icon={<Shield className="h-5 w-5 text-primary" />}
                title="Badges & Streaks"
                description="Unlock 15+ achievements. Maintain daily streaks for bonus XP."
              />
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Level</span>
                <span className="font-bold text-primary">Advanced</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-3">
                <div className="bg-primary h-3 rounded-full w-3/4 transition-all" />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-secondary rounded-lg p-3">
                  <div className="text-2xl font-bold">2,450</div>
                  <div className="text-xs text-muted-foreground">Total XP</div>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-xs text-muted-foreground">Day Streak</div>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <div className="text-2xl font-bold">89%</div>
                  <div className="text-xs text-muted-foreground">Accuracy</div>
                </div>
              </div>
              <div className="flex gap-2">
                {["🛡️", "🔥", "🎯", "⚡", "🏆"].map((emoji, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-lg"
                  >
                    {emoji}
                  </div>
                ))}
                <div className="w-10 h-10 bg-secondary/50 rounded-lg flex items-center justify-center text-lg opacity-40">
                  🔒
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 text-center border-t border-border/50">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to Sharpen Your Instincts?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          Join CyberSense and start building real-world defenses against social
          engineering attacks. It&apos;s free, forever.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-all glow-green"
        >
          Create Free Account
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold">CyberSense</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 CyberSense. Built to strengthen human defenses against cyber
            threats.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-all group">
      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:bg-primary/20 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function GamificationItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
