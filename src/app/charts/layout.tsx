import DashboardLayout from "@/app/dashboard/layout";

export default function ChartsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
