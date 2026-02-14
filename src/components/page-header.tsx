type PageHeaderProps = {
  title: string;
  description: string;
  children?: React.ReactNode;
};

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-3xl font-heading tracking-tight">{title}</h2>
        <p className="mt-1 font-base text-foreground/70">{description}</p>
      </div>
      {children ? <div className="flex items-center gap-2">{children}</div> : null}
    </div>
  );
}
