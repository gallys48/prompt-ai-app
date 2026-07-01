type PageContainerProps = {
  children: React.ReactNode;
};

export function PageContainer({ children }: PageContainerProps) {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-neutral-950 px-4 py-8 text-neutral-100">
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </main>
  );
}