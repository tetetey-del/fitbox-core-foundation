import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { postsRepo } from "@/lib/storage/repositories/posts.repo";
import { notifyDataChanged } from "@/lib/data-bus";
import type { Post, PostType } from "@/types";
import { POST_TYPE_LABEL } from "@/types";

import { compressImage, dataUrlBytes } from "@/lib/image";
import { MAX_POST_IMAGE_BYTES } from "@/lib/constants";

async function readAsDataUrl(file: File): Promise<string> {
  const compressed = await compressImage(file);
  if (dataUrlBytes(compressed) > MAX_POST_IMAGE_BYTES) {
    throw new Error("La imagen sigue siendo demasiado grande tras comprimir");
  }
  return compressed;
}

export function PostFormDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Post | null;
}) {
  const { currentUser, currentTenant } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<PostType>("aviso");
  const [pinned, setPinned] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? "");
    setContent(initial?.content ?? "");
    setType(initial?.type ?? "aviso");
    setPinned(initial?.pinned ?? false);
    setImageUrl(initial?.imageUrl);
  }, [open, initial]);

  const onFile = async (file?: File | null) => {
    if (!file) return;
    if (file.size > MAX_POST_IMAGE_BYTES) {
      toast.error("La imagen debe pesar menos de 800 KB");
      return;
    }
    setImageUrl(await readAsDataUrl(file));
  };

  const submit = () => {
    if (!currentUser || !currentTenant) return;
    if (!title.trim()) return toast.error("El título es obligatorio");
    if (!content.trim()) return toast.error("El contenido es obligatorio");
    const payload = {
      title: title.trim(),
      content: content.trim(),
      type,
      pinned,
      imageUrl,
    };
    if (initial) {
      postsRepo.update(initial.id, payload);
      toast.success("Post actualizado");
    } else {
      postsRepo.create({
        ...payload,
        tenantId: currentTenant.id,
        authorId: currentUser.id,
      });
      toast.success("Post publicado");
    }
    notifyDataChanged();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar post" : "Nuevo post"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as PostType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(POST_TYPE_LABEL) as PostType[]).map((k) => (
                    <SelectItem key={k} value={k}>{POST_TYPE_LABEL[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2 pb-1">
              <Switch id="pin" checked={pinned} onCheckedChange={setPinned} />
              <Label htmlFor="pin" className="text-sm font-normal">Fijar arriba</Label>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Contenido</Label>
            <Textarea rows={5} value={content} onChange={(e) => setContent(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Imagen (opcional)</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            {imageUrl && (
              <div className="mt-2 relative">
                <img src={imageUrl} alt="" className="rounded-md border border-border max-h-40 object-cover" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setImageUrl(undefined)}
                  className="mt-1"
                >
                  Quitar imagen
                </Button>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit}>{initial ? "Guardar" : "Publicar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
