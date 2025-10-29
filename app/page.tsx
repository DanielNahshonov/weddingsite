export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 text-center text-zinc-700">
      <div className="max-w-lg space-y-6">
        <h1 className="text-3xl font-semibold text-zinc-900">
          Wedding Invitation Workspace
        </h1>
        <p className="text-sm">
          Hi! This project powers personal wedding invitations and RSVP
          tracking. To view an invitation, use a guest link such as{" "}
          <code className="mx-1 inline-block rounded bg-zinc-200 px-2 py-1 text-xs text-zinc-800">
            /invite/&lt;guestId&gt;
          </code>
          . The admin panel will live at{" "}
          <code className="mx-1 inline-block rounded bg-zinc-200 px-2 py-1 text-xs text-zinc-800">
            /admin
          </code>
          .
        </p>
      </div>
    </div>
  );
}
