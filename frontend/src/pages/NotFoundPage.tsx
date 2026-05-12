import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <Link className="mt-4 text-primary underline-offset-4 hover:underline" to="/">
        Return home
      </Link>
    </section>
  );
}
