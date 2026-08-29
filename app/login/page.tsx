import LoginForm from "./LoginForm";

export default function LoginPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const raw = searchParams.next;
  const nextPath =
    typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;

  return <LoginForm nextPath={nextPath} />;
}
