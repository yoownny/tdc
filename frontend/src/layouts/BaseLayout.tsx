import Header from "@/components/header/Header";

interface BaseLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
}

const BaseLayout = ({ children, showHeader = false }: BaseLayoutProps) => {
  return (
    <div className="min-h-screen bg-primary">
      {showHeader && (
        <header className="w-full">
          <Header />
        </header>
      )}
      <main className="max-w-[1440px] mx-auto px-4">{children}</main>
    </div>
  );
};

export default BaseLayout;
