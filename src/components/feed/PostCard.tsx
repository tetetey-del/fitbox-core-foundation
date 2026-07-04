import { Pin, Pencil, Trash2 } from "lucide-react";
import type { Post } from "@/types";
import { POST_TYPE_LABEL } from "@/types";
import { Button } from "@/components/ui/button";
import { POST_ICONS, POST_COLORS } from "@/routes/feed";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";

export function PostCard({
  post,
  authorName,
  canEdit,
  onEdit,
  onDelete,
}: {
  post: Post;
  authorName: string;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = POST_ICONS[post.type];
  const color = POST_COLORS[post.type];
  return (
    <article className="rounded-lg border border-border bg-card overflow-hidden">
      {post.imageUrl && (
        <div className="aspect-video bg-muted">
          <img src={post.imageUrl} alt="" className="size-full object-cover" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border",
              color,
            )}
          >
            <Icon className="h-3 w-3" strokeWidth={1.5} />
            {POST_TYPE_LABEL[post.type]}
          </span>
          {post.pinned && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border border-border text-muted-foreground">
              <Pin className="h-3 w-3" strokeWidth={1.5} />
              Fijado
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {formatDate(post.createdAt.slice(0, 10))}
          </span>
        </div>
        <h3 className="mt-3 text-lg font-semibold tracking-tight">{post.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
          {post.content}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Por {authorName}</span>
          {canEdit && (
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" aria-label="Editar" onClick={onEdit}>
                <Pencil className="h-4 w-4" strokeWidth={1.5} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Eliminar"
                className="text-muted-foreground hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
