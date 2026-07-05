import { NextResponse } from "next/server";
import { generateScenario, type ScenarioType } from "@/lib/scenario-engine";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as ScenarioType;
    const difficulty = searchParams.get("difficulty");

    if (!type || !["phishing", "pretexting", "vishing"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be: phishing, pretexting, or vishing" },
        { status: 400 }
      );
    }

    const scenario = generateScenario(
      type,
      difficulty ? parseInt(difficulty) : undefined
    );

    return NextResponse.json({ scenario });
  } catch (error) {
    console.error("Scenario generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate scenario" },
      { status: 500 }
    );
  }
}
