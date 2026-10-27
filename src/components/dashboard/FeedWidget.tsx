import { Link } from "@tanstack/react-router";
import { ArrowRight, Pin } from "lucide-react";
import { postsRepo } from "@/lib/storage/repositories/posts.repo";
import { hideWodPostsForCurrentUser } from "@/lib/services/wods.service";
import { POST_TYPE_LABEL } from "@/types";
import { POST_ICONS, POST_COLORS } from "@/routes/feed";
import { useDataVersion } from "@/lib/data-bus";
import { cn } from "@/lib/utils";

export function FeedWidget() {
  useDataVersion();
  const hideWods = hideWodPostsForCurrentUser();
  const posts = postsRepo
    .list()
    .filter((p) => !(hideWods && p.type === "wod"))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, 3);

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold tracking-tight">Último del feed</h3>
        <Link
          to="/feed"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          Ver todo <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
        </Link>
      </div>
      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay publicaciones.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2">
          {posts.map((p) => {
            const Icon = POST_ICONS[p.type];
            return (
              <li key={p.id} className="min-w-0">
                <Link
                  to="/feed"
                  className="flex items-start gap-3 rounded-md border border-transparent p-2 hover:border-border hover:bg-muted/40 transition-colors"
                >
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-md border shrink-0",
                      POST_COLORS[p.type],
                    )}
                  >
                    <Icon className="h-3 w-3" strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="min-w-0 text-sm font-medium truncate">{p.title}</span>
                      {p.pinned && <Pin className="h-3 w-3 text-muted-foreground shrink-0" strokeWidth={1.5} />}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {POST_TYPE_LABEL[p.type]}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
