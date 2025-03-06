// import { Sidebar } from "@/components/Sidebar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      {/* <Sidebar /> */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
