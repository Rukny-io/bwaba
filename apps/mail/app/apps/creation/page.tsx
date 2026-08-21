import { getCurrentMailUser } from "@/lib/current-user";
import { MailFirstAppSetup } from "@/components/apps/mail-first-app-setup";
import { redirect } from "next/navigation";

export default async function MailAppCreationPage() {
  const user = await getCurrentMailUser();
  if (!user) {
    redirect("/login");
  }

  return <MailFirstAppSetup defaultEmail={user.email ?? ""} />;
}
