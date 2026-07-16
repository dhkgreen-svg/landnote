import { notFound } from 'next/navigation';
import Step1Client from './Step1Client';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function getAgent(agentCode: string) {
  if (!API_URL) {
    console.warn("API_URL is undefined. Using mock agent data for UI testing.");
    return {
      agent_name: '테스트 중개사',
      office_name: '테스트 부동산',
      phone: '010-1234-5678',
      selected_categories: ['residential', 'commercial', 'industrial', 'land'],
      subscription_plan: 'pro' as const,
    };
  }
  try {
    const res = await fetch(`${API_URL}/public/agent/${agentCode}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as {
      agent_name: string;
      office_name: string;
      phone: string;
      selected_categories: any[];
      subscription_plan: 'starter' | 'pro';
    };
  } catch (e) {
    console.error("Fetch failed, using mock data", e);
    return {
      agent_name: '테스트 중개사',
      office_name: '테스트 부동산',
      phone: '010-1234-5678',
      selected_categories: ['residential', 'commercial', 'industrial', 'land'],
      subscription_plan: 'pro' as const,
    };
  }
}

export default async function FormStep1Page({
  params,
}: {
  params: { agentCode: string };
}) {
  const agent = await getAgent(params.agentCode);
  if (!agent) notFound();

  return (
    <Step1Client
      agentCode={params.agentCode}
      agentName={agent.agent_name}
      officeName={agent.office_name}
      phone={agent.phone}
      selectedCategories={agent.selected_categories}
      subscriptionPlan={agent.subscription_plan}
    />
  );
}
