export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-white to-purple-500 px-4">
      <div className="container mx-auto">{children}</div>
    </div>
  );
}
