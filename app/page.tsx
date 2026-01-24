export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="relative mx-auto min-h-screen w-full max-w-[480px] overflow-hidden bg-black shadow-[0_0_40px_rgba(15,23,42,0.08)]">
        <img
          src="/hero.jpeg"
          alt="Wedding invitation background"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
