import { HomeHeader } from "@/features/home/components/home-header";
import { HomeFooter } from "@/features/home/components/home-footer";
import { ReferralJoinView } from "@/features/discounts/views/referral-join-view";
import { getServerSession } from "@/lib/auth-server";

type Props = {
  params: Promise<{ locale: string; code: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { code } = await params;
  return {
    title: `Invite ${code.toUpperCase()} — Moja Ride`,
    description: "Join Moja Ride with a friend invite and start booking buses.",
  };
}

export default async function ReferralCodePage({ params }: Props) {
  const { code } = await params;
  const session = await getServerSession();
  const normalized = decodeURIComponent(code).trim().toUpperCase();

  return (
    <div className="overflow-x-hidden">
      <HomeHeader user={session?.user} />
      <main>
        <ReferralJoinView code={normalized} />
      </main>
      <HomeFooter />
    </div>
  );
}
