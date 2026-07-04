import { useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDataVersion, notifyDataChanged } from "@/lib/data-bus";
import {
  getUnreadCount,
  listMyNotifications,
  markAllRead,
  markRead,
  relativeTime,
} from "@/lib/services/notifications.service";

export function NotificationBell() {
  useDataVersion();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const items = listMyNotifications().slice(0, 30);
  const unread = getUnreadCount();

  const onClickItem = (id: string, linkTo?: string) => {
    markRead(id);
    notifyDataChanged();
    setOpen(false);
    if (linkTo) navigate({ to: linkTo });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notificaciones${unread ? ` (${unread} sin leer)` : ""}`}
        >
          <Bell className="h-4 w-4" strokeWidth={1.5} />
          {unread > 0 && (
            <span
              aria-hidden
              className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold leading-4 text-center"
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0">
        <div className="flex items-center justify-between px-3 h-11 border-b border-border">
          <span className="text-sm font-medium">Notificaciones</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            disabled={unread === 0}
            onClick={() => {
              markAllRead();
              notifyDataChanged();
            }}
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1" strokeWidth={1.5} />
            Marcar todas
          </Button>
        </div>
        <ScrollArea className="max-h-[70vh]">
          {items.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Sin notificaciones por ahora.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => onClickItem(n.id, n.linkTo)}
                    className={`w-full text-left px-3 py-3 flex gap-3 hover:bg-muted/50 transition-colors ${n.read ? "opacity-70" : ""}`}
                  >
                    <span
                      aria-hidden
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-primary"}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{n.title}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {relativeTime(n.createdAt)}
                        </span>
                      </span>
                      <span className="block text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {n.body}
                      </span>
                    </span>
                    {n.read && (
                      <Check
                        className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 mt-1"
                        strokeWidth={1.5}
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
