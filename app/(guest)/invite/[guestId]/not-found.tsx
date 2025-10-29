export default function GuestNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 text-center text-zinc-700">
      <div className="max-w-md space-y-4">
        <h1 className="text-3xl font-semibold text-zinc-900">
          Invitation not found
        </h1>
        <p className="text-sm">
          This personal link is no longer available. Please contact the couple
          so they can resend the correct invitation.
        </p>
      </div>
    </main>
  );
}
