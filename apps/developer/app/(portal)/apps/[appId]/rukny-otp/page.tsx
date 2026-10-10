import { RuknyOtpOverview } from "@/components/rukny-otp/rukny-otp-overview";

export default async function RuknyOtpPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  return <RuknyOtpOverview appId={appId} />;
}
