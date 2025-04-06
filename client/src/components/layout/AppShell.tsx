import { ReactNode } from "react";
import Header from "./Header";
import MobileNavigation from "./MobileNavigation";

interface AppShellProps {
  children: ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pb-20 md:pb-10">
        {children}
      </main>
      <MobileNavigation />
    </div>
  );
};

export default AppShell;
