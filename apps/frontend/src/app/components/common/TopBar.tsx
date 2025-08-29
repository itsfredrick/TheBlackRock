import { Search } from "lucide-react"
import AvatarMenu from "./AvatarMenu"
import DevAuthBadge from "./DevAuthBadge"

export default function TopBar() {
  return (
    <header className="h-[64px] w-full px-4 lg:px-8 flex items-center justify-between">
      <div className="glass h-12 flex items-center gap-3 rounded-2xl px-4 w-full max-w-xl card-hover animate-fade-up">
        <Search className="w-4 h-4 opacity-70" />
        <input
          placeholder="Search projects, experts, suppliers…"
          className="bg-transparent outline-none w-full placeholder:text-white/60"
        />
      </div>
      <div className="flex items-center gap-3">
        <DevAuthBadge />
        <AvatarMenu />
      </div>
    </header>
  )
}
