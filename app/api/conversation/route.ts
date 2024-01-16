import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { Configuration, OpenAIApi } from "openai";
import { increaseApiLimit, checkApiLimit } from "@/lib/api-limit";
require("dotenv").config();
const config = new Configuration({
  organization: process.env.OPENAI_ORGANIZATION,
  apiKey: process.env.OPENAI_API_KEY,
});
console.log(process.env.OPENAI_ORGANIZATION);
console.log(process.env.OPENAI_API_KEY);
const openai = new OpenAIApi(config);
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
    console.log("start");
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages,
    });
    console.log(response);
    await increaseApiLimit();
    return NextResponse.json(response.data.choices[0].message);
  } catch (error) {
    console.log("[CONVERSATION_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
