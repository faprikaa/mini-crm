import DashboardLayout from "@/app/dashboard/layout";

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
