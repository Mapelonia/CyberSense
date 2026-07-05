import phishingTemplates from "@/templates/phishing.json";
import pretextingTemplates from "@/templates/pretexting.json";
import vishingTemplates from "@/templates/vishing.json";

export type ScenarioType = "phishing" | "pretexting" | "vishing";
export type Tactic = "urgency" | "authority" | "fear" | "curiosity" | "reward" | "trust";

export interface RedFlag {
  id: string;
  location?: string;
  step?: number;
  timestamp?: string;
  tactic: Tactic;
  description: string;
  explanation?: string;
}

export interface PhishingScenario {
  id: string;
  type: "phishing";
  difficulty: number;
  manipulation_tactics: Tactic[];
  subject: string;
  sender_email: string;
  sender_name: string;
  body: string;
  red_flags: RedFlag[];
  is_malicious: boolean;
}

export interface DialogueOption {
  id: string;
  text: string;
  score: "comply" | "partial" | "resist";
  leads_to: number;
}

export interface DialogueStep {
  step: number;
  attacker_message?: string | null;
  caller_message?: string | null;
  options?: DialogueOption[];
  outcome?: "resisted" | "manipulated";
  feedback?: string;
}

export interface PretextingScenario {
  id: string;
  type: "pretexting";
  difficulty: number;
  manipulation_tactics: Tactic[];
  context: string;
  dialogue: DialogueStep[];
  red_flags: RedFlag[];
}

export interface TranscriptLine {
  speaker: string;
  timestamp: string;
  text: string;
  has_tactic?: boolean;
  tactic?: Tactic;
  explanation?: string;
}

export interface VishingScenario {
  id: string;
  type: "vishing";
  mode: "transcript" | "interactive";
  difficulty: number;
  manipulation_tactics: Tactic[];
  caller_id: string;
  caller_number: string;
  duration?: string;
  context?: string;
  transcript?: TranscriptLine[];
  dialogue?: DialogueStep[];
  red_flags: RedFlag[];
}

export type Scenario = PhishingScenario | PretextingScenario | VishingScenario;

// Random selection helpers
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDomain(company: string): string {
  const domains = [
    `${company.toLowerCase().replace(/\s/g, "")}-secure.com`,
    `${company.toLowerCase().replace(/\s/g, "")}-verify.net`,
    `secure-${company.toLowerCase().replace(/\s/g, "")}.org`,
    `${company.toLowerCase().replace(/\s/g, "")}-support.io`,
  ];
  return pickRandom(domains);
}

function substituteVariables(text: string, variables: Record<string, string[] | string>): string {
  let result = text;
  for (const [key, values] of Object.entries(variables)) {
    const value = Array.isArray(values) ? pickRandom(values) : values;
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    result = result.replace(regex, value);
  }
  // Handle computed variables
  result = result.replace(/\{\{company_domain\}\}/g, (match) => {
    const companyMatch = result.match(/(?:PayPal|Netflix|Amazon|Apple|Chase|Wells Fargo)/i);
    return companyMatch ? companyMatch[0].toLowerCase().replace(/\s/g, "") : "company";
  });
  result = result.replace(/\{\{company_lower\}\}/g, (match) => {
    const companyMatch = result.match(/(?:PayPal|Netflix|Amazon|Apple|Microsoft|Google|Starbucks|Target|Walmart)/i);
    return companyMatch ? companyMatch[0].toLowerCase().replace(/\s/g, "") : "company";
  });
  result = result.replace(/\{\{random_domain\}\}/g, pickRandom(["corp-mail", "business-comms", "office-net", "enterprise-sys"]));
  return result;
}

export function generateScenario(type: ScenarioType, difficulty?: number): Scenario {
  let templates: any[];

  switch (type) {
    case "phishing":
      templates = phishingTemplates;
      break;
    case "pretexting":
      templates = pretextingTemplates;
      break;
    case "vishing":
      templates = vishingTemplates;
      break;
    default:
      throw new Error(`Invalid scenario type: ${type}`);
  }

  // Filter by difficulty if specified
  let filtered = templates;
  if (difficulty) {
    filtered = templates.filter((t: any) => t.difficulty === difficulty);
    if (filtered.length === 0) {
      filtered = templates; // Fallback to all if none match
    }
  }

  const template = pickRandom(filtered);
  const variables = template.variables || {};

  // Resolve all variable values for this generation
  const resolvedVars: Record<string, string> = {};
  for (const [key, values] of Object.entries(variables)) {
    resolvedVars[key] = Array.isArray(values) ? pickRandom(values as string[]) : (values as string);
  }

  if (type === "phishing") {
    return generatePhishingScenario(template, resolvedVars);
  } else if (type === "pretexting") {
    return generatePretextingScenario(template, resolvedVars);
  } else {
    return generateVishingScenario(template, resolvedVars);
  }
}

function applyVars(text: string, vars: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    result = result.replace(regex, value);
  }
  // Handle derived variables
  const company = vars.company || vars.bank || "";
  result = result.replace(/\{\{company_domain\}\}/g, company.toLowerCase().replace(/\s/g, ""));
  result = result.replace(/\{\{company_lower\}\}/g, company.toLowerCase().replace(/\s/g, ""));
  result = result.replace(/\{\{random_domain\}\}/g, pickRandom(["corp-mail", "business-comms", "office-net", "enterprise-sys"]));
  return result;
}

function generatePhishingScenario(template: any, vars: Record<string, string>): PhishingScenario {
  return {
    id: `${template.id}-${Date.now()}`,
    type: "phishing",
    difficulty: template.difficulty,
    manipulation_tactics: template.manipulation_tactics,
    subject: applyVars(template.subject, vars),
    sender_email: applyVars(template.sender_email, vars),
    sender_name: vars.sender_name || "Unknown Sender",
    body: applyVars(template.body, vars),
    red_flags: template.red_flags.map((rf: any) => ({
      ...rf,
      description: applyVars(rf.description, vars),
    })),
    is_malicious: template.is_malicious,
  };
}

function generatePretextingScenario(template: any, vars: Record<string, string>): PretextingScenario {
  return {
    id: `${template.id}-${Date.now()}`,
    type: "pretexting",
    difficulty: template.difficulty,
    manipulation_tactics: template.manipulation_tactics,
    context: applyVars(template.context, vars),
    dialogue: template.dialogue.map((step: any) => ({
      ...step,
      attacker_message: step.attacker_message ? applyVars(step.attacker_message, vars) : null,
      feedback: step.feedback ? applyVars(step.feedback, vars) : undefined,
      options: step.options?.map((opt: any) => ({
        ...opt,
        text: applyVars(opt.text, vars),
      })),
    })),
    red_flags: template.red_flags.map((rf: any) => ({
      ...rf,
      description: applyVars(rf.description, vars),
    })),
  };
}

function generateVishingScenario(template: any, vars: Record<string, string>): VishingScenario {
  const base: VishingScenario = {
    id: `${template.id}-${Date.now()}`,
    type: "vishing",
    mode: template.mode,
    difficulty: template.difficulty,
    manipulation_tactics: template.manipulation_tactics,
    caller_id: applyVars(template.caller_id, vars),
    caller_number: template.caller_number,
    red_flags: template.red_flags.map((rf: any) => ({
      ...rf,
      description: applyVars(rf.description, vars),
    })),
  };

  if (template.mode === "transcript") {
    base.duration = template.duration;
    base.transcript = template.transcript.map((line: any) => ({
      ...line,
      text: applyVars(line.text, vars),
      explanation: line.explanation ? applyVars(line.explanation, vars) : undefined,
    }));
  } else {
    base.context = template.context ? applyVars(template.context, vars) : undefined;
    base.dialogue = template.dialogue.map((step: any) => ({
      ...step,
      caller_message: step.caller_message ? applyVars(step.caller_message, vars) : null,
      feedback: step.feedback ? applyVars(step.feedback, vars) : undefined,
      options: step.options?.map((opt: any) => ({
        ...opt,
        text: applyVars(opt.text, vars),
      })),
    }));
  }

  return base;
}

// Get scenarios by type
export function getAvailableTypes(): ScenarioType[] {
  return ["phishing", "pretexting", "vishing"];
}

export function getDifficultyRange(type: ScenarioType): { min: number; max: number } {
  let templates: any[];
  switch (type) {
    case "phishing":
      templates = phishingTemplates;
      break;
    case "pretexting":
      templates = pretextingTemplates;
      break;
    case "vishing":
      templates = vishingTemplates;
      break;
    default:
      return { min: 1, max: 5 };
  }
  const difficulties = templates.map((t: any) => t.difficulty);
  return { min: Math.min(...difficulties), max: Math.max(...difficulties) };
}
