import { NavLink } from "react-router-dom";
import { cn } from "../lib/cn";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Library,
  BarChart3,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Avatar } from "./ui/Avatar";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "الرئيسية" },
  { to: "/children", icon: Users, label: "الأطفال" },
  { to: "/create-story", icon: Sparkles, label: "إنشاء قصة" },
  { to: "/library", icon: Library, label: "المكتبة" },
  { to: "/progress", icon: BarChart3, label: "التقدم" },
];

export function Sidebar() {
  const { user, signOut } = useAuth();

  return (
    <aside className="fixed inset-inline-start-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar text-white">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold">غراس</h1>
          <p className="text-xs text-white/60">قصص ذكية لأطفالك</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar name={user?.name || "م"} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-white/60 truncate">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            title="تسجيل الخروج"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
