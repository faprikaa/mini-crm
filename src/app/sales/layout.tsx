import DashboardLayout from "@/app/dashboard/layout";

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
