import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="border-b-2 border-retro-dark px-6 py-4">
        <Link href="/" className="font-mono font-bold text-xl tracking-tight text-retro-dark">
          NoBrainy<span className="text-retro-pink">.</span>
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md border-2 border-retro-dark bg-white p-8 shadow-hard">
          {children}
        </div>
      </div>
    </div>
  )
}
