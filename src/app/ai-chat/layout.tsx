import DashboardLayout from "@/app/dashboard/layout";

export default function AiChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
