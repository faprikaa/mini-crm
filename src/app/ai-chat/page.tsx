import { AIChatClient } from "./chat-client";

export default function AIChatPage() {
  const aiBaseUrl = process.env.AI_BASE_URL || "(not set)";
  const aiModel = process.env.AI_MODEL || "meta/llama-3.1-8b-instruct";

  return <AIChatClient aiBaseUrl={aiBaseUrl} aiModel={aiModel} />;
}
