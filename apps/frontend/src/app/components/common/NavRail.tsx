import { Home, Briefcase, Users, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import clsx from "clsx";

type Props = {
  activePath: string;
};

const navItems = [
  { path: "/dashboard/entrepreneur", label: "Entrepreneur", icon: Home },
  { path: "/dashboard/engineer", label: "Engineer", icon: Briefcase },
  { path: "/dashboard/investor", label: "Investor", icon: Users },
  { path: "/dashboard/admin", label: "Admin", icon: Settings },
];

export default function NavRail({ activePath }: Props) {
  return (
    <aside className="w-20 bg-glass backdrop-blur-xl border-r border-white/10 h-screen flex flex-col items-center py-6">
      {navItems.map(({ path, label, icon: Icon }) => (
        <Link
          key={path}
          to={path}
          className={clsx(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors text-sm",
            activePath === path
              ? "bg-white/20 text-white"
              : "text-white/60 hover:text-white hover:bg-white/10"
          )}
        >
          <Icon className="h-6 w-6" />
          <span>{label}</span>
        </Link>
      ))}
    </aside>
  );
}
