import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth-server";

export default async function Home() {
  return <>Hi</>;
}
