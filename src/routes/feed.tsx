import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Lightbulb,
  Utensils,
  Dumbbell,
  Pin,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useDataVersion, notifyDataChanged } from "@/lib/data-bus";
import { useModules } from "@/hooks/useModules";
import { postsRepo } from "@/lib/storage/repositories/posts.repo";
import { hideWodPostsForCurrentUser } from "@/lib/services/wods.service";
import { PostFormDialog } from "@/components/feed/PostFormDialog";
import { PostCard } from "@/components/feed/PostCard";
import type { Post } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const POST_ICONS = {
  aviso: AlertTriangle,
  consejo: Lightbulb,
  receta: Utensils,
  wod: Dumbbell,
} as const;

export const POST_COLORS: Record<Post["type"], string> = {
  aviso: "text-red-400 border-red-500/30 bg-red-500/10",
  consejo: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  receta: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  wod: "text-sky-400 border-sky-500/30 bg-sky-500/10",
};

export const Route = createFileRoute("/feed")({ component: FeedPage });

function FeedPage() {
  const navigate = useNavigate();
  const modules = useModules();
  const { currentUser, tenantUsers } = useAuth();
  useDataVersion();
  const [editing, setEditing] = useState<Post | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Post | null>(null);

  useEffect(() => {
    if (!modules.feed) {
      toast.error("El módulo Feed está desactivado");
      navigate({ to: "/dashboard" });
    }
  }, [modules.feed, navigate]);

  const hideWods = hideWodPostsForCurrentUser();
  const posts = postsRepo.list().filter((p) => !(hideWods && p.type === "wod")).sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  const isStaff = currentUser?.role === "admin" || currentUser?.role === "coach";
  const authorOf = (id: string) => tenantUsers.find((u) => u.id === id)?.name ?? "Desconocido";

  const handleDelete = () => {
    if (!toDelete) return;
    postsRepo.remove(toDelete.id);
    toast.success("Post eliminado");
    setToDelete(null);
    notifyDataChanged();
  };

  return (
    <AppLayout>
      <PageHeader
        title="Feed"
        description="Avisos, consejos, recetas y WODs del box."
      >
        {isStaff && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Nuevo post
          </Button>
        )}
      </PageHeader>

      {posts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <Dumbbell className="h-6 w-6 mx-auto text-muted-foreground" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-muted-foreground">
            El feed está vacío. {isStaff ? "Crea el primer post." : "Aún no hay publicaciones."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 max-w-3xl">
          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              authorName={authorOf(p.authorId)}
              canEdit={isStaff}
              onEdit={() => setEditing(p)}
              onDelete={() => setToDelete(p)}
            />
          ))}
        </div>
      )}

      <PostFormDialog
        open={creating || !!editing}
        initial={editing}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false);
            setEditing(null);
          }
        }}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o: boolean) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar post?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará &quot;{toDelete?.title}&quot; del feed. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

export { Pencil, Trash2, Pin };
