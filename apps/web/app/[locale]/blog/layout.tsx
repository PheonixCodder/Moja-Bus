import { HomeHeader } from "@/features/home/components/home-header";
import { HomeFooter } from "@/features/home/components/home-footer";
import { getServerSession } from "@/lib/auth-server";

export default async function BlogLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  return (
    <div className="flex flex-col min-h-screen">
      <HomeHeader user={session?.user} />
      <main className="flex-1">{children}</main>
      <HomeFooter />
    </div>
  );
}
