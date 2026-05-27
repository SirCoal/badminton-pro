import { signIn, signInWithGoogle, signUp } from './actions'

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
      <h1 className="mb-6 text-3xl font-bold">Login</h1>

      <form action={signIn} className="mb-4 space-y-4 rounded-2xl border p-4">
        <h2 className="text-xl font-semibold">Email login</h2>
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full rounded-lg border p-3"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="w-full rounded-lg border p-3"
        />
        <button type="submit" className="w-full rounded-lg bg-black p-3 text-white">
          Sign in
        </button>
      </form>

      <form action={signUp} className="mb-4 space-y-4 rounded-2xl border p-4">
        <h2 className="text-xl font-semibold">Create account</h2>
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full rounded-lg border p-3"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="w-full rounded-lg border p-3"
        />
        <button type="submit" className="w-full rounded-lg bg-blue-600 p-3 text-white">
          Sign up
        </button>
      </form>

      <form action={signInWithGoogle}>
        <button type="submit" className="w-full rounded-lg border p-3 font-medium">
          Continue with Google
        </button>
      </form>
    </main>
  )
}