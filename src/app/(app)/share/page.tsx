import { ShareForm } from "@/components/ShareForm";

export const dynamic = "force-dynamic";

type Params = Promise<{ title?: string; text?: string; url?: string }>;

export default async function SharePage({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  return (
    <main className="grid min-h-screen place-items-start justify-center p-4">
      <ShareForm title={sp.title ?? ""} text={sp.text ?? ""} url={sp.url ?? ""} />
    </main>
  );
}
