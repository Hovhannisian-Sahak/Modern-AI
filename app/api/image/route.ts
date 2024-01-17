import { increaseApiLimit, checkApiLimit } from "@/lib/api-limit";
import { checkSubscription } from "@/lib/subscription";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
require("dotenv").config();
const config = new Configuration({
  organization: process.env.OPENAI_ORGANIZATION,
  apiKey: process.env.OPENAI_API_KEY,
});
console.log(process.env.OPENAI_ORGANIZATION);
console.log(process.env.OPENAI_API_KEY);
const openai = new OpenAIApi(config);
const instructionMessage: ChatCompletionRequestMessage = {
  role: "system",
  content:
    "You are a code generator.You have no emotions.You must answer only in markdown code snippets.Use comments for better explanation",
};
export async function POST(req: Request) {
  try {
    const { userId } = auth();
    console.log(userId);
    const body = await req.json();

    const { prompt, amount = 1, resolution = "512x512" } = body;
    console.log(prompt, amount, resolution);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    if (!config.apiKey) {
      return new NextResponse("OpenAI API Key not configured", { status: 500 });
    }
    console.log(config);
    if (!prompt) {
      return new NextResponse("messages is required", { status: 400 });
    }
    if (!resolution) {
      return new NextResponse("resolution is required", { status: 400 });
    }
    if (!amount) {
      return new NextResponse("amount is required", { status: 400 });
    }
    const freeTrial = await checkApiLimit();
    const isPro = await checkSubscription();
    if (!freeTrial && !isPro) {
      return new NextResponse(
        "You have exceeded your API limit for the free tier",
        { status: 403 }
      );
    }
    const response = await openai.createImage({
      prompt,
      n: parseInt(amount, 10),
      size: resolution,
    });
    console.log(response);
    if (!isPro) {
      await increaseApiLimit();
    }
    console.log(response);
    return NextResponse.json(response.data.data);
  } catch (error) {
    console.log("[IMAGE_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
