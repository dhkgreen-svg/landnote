import { ChatInterface } from '@/components/bot/ChatInterface';

export default function BotPage({ params }: { params: { agentId: string } }) {
  // In a real scenario, we might fetch agent details here to brand the bot
  // or verify the agent exists before rendering the chat interface.

  return (
    <main className="flex-1 flex flex-col h-full bg-slate-50">
      <ChatInterface agentId={params.agentId} />
    </main>
  );
}
