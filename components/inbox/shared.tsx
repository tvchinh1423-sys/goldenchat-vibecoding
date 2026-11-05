import { Globe, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHANNEL_LABELS } from "@/lib/inbox/helpers";
import type { Channel, Conversation } from "@/lib/inbox/types";

export function ChannelIcon({
  channel,
  className,
}: {
  channel: Channel;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      title={CHANNEL_LABELS[channel]}
      className={cn(
        "inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-white bg-[#286eea] text-[10px] font-bold leading-none text-white",
        channel === "web" && "bg-white text-muted-foreground",
        channel === "zalo" && "bg-blue-600",
        className,
      )}
    >
      {channel === "facebook" ? (
        "f"
      ) : channel === "zalo" ? (
        <MessageCircle className="h-2.5 w-2.5" />
      ) : (
        <Globe className="h-3.5 w-3.5" />
      )}
    </span>
  );
}
const avatarColors: Record<string, string> = {
  peach: "bg-[#f4ddd4] text-[#9d6051]",
  pink: "bg-[#f0ddec] text-[#9a618c]",
  sage: "bg-[#dfe9da] text-[#67825d]",
  lavender: "bg-[#e8e4f5] text-[#80709e]",
  sky: "bg-[#dceaf4] text-[#587e9c]",
  sand: "bg-[#eee4d4] text-[#998165]",
};
export function Avatar({
  conversation,
  small = false,
}: {
  conversation: Conversation;
  small?: boolean;
}) {
  const initials = conversation.name
    .split(" ")
    .slice(-2)
    .map((word) => word.charAt(0))
    .join("");
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full font-semibold",
        small ? "h-7 w-7 text-[10px]" : "h-11 w-11 text-sm",
        avatarColors[conversation.avatarColor] ?? avatarColors.lavender,
      )}
      aria-hidden="true"
    >
      {initials}
      {!small && (
        <ChannelIcon
          channel={conversation.channel}
          className="absolute -bottom-0.5 -right-0.5"
        />
      )}
    </div>
  );
}
