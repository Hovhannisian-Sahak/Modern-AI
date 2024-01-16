import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import { increaseApiLimit, checkApiLimit } from "@/lib/api-limit";
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

    const { messages } = body;
    console.log(messages);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    if (!config.apiKey) {
      return new NextResponse("OpenAI API Key not configured", { status: 500 });
    }
    if (!messages) {
      return new NextResponse("messages are required", { status: 400 });
    }
    const freeTrial = await checkApiLimit();
    if (!freeTrial) {
      return new NextResponse(
        "You have exceeded your API limit for the free tier",
        { status: 403 }
      );
    }
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [instructionMessage, ...messages],
    });
    await increaseApiLimit();
    console.log(response);
    return NextResponse.json(response.data.choices[0].message);
  } catch (error) {
    console.log("[CODE_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
