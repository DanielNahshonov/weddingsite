export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="mx-auto min-h-screen w-full max-w-[480px] bg-white shadow-[0_0_40px_rgba(15,23,42,0.08)]">
        {children}
      </div>
    </div>
  );
}
