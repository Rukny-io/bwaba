"use client";

import { useEffect, useRef, useState } from "react";
import {
  joinSupportTicket,
  leaveSupportTicket,
  subscribeSupportSocket,
  type LiveSupportMessage,
  type LiveTicketUpdate,
} from "@/lib/support-tickets-socket";

type UseSupportTicketLiveOptions = {
  isStaff?: boolean;
  onMessage?: (message: LiveSupportMessage) => void;
  onInternalMessage?: (message: LiveSupportMessage) => void;
  onTicketUpdated?: (update: LiveTicketUpdate) => void;
};

export function useSupportTicketLive(
  ticketId: string | null,
  options: UseSupportTicketLiveOptions,
) {
  const [isLive, setIsLive] = useState(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!ticketId) return;

    const unsub = subscribeSupportSocket({
      onConnect: () => {
        setIsLive(true);
        void joinSupportTicket(ticketId);
      },
      onDisconnect: () => setIsLive(false),
      onMessage: (message) => {
        if (message.ticketId === ticketId) {
          optionsRef.current.onMessage?.(message);
        }
      },
      onInternalMessage: (message) => {
        if (message.ticketId === ticketId) {
          optionsRef.current.onInternalMessage?.(message);
        }
      },
      onTicketUpdated: (update) => {
        if (update.ticketId === ticketId) {
          optionsRef.current.onTicketUpdated?.(update);
        }
      },
    });

    void joinSupportTicket(ticketId);

    return () => {
      setIsLive(false);
      leaveSupportTicket(ticketId);
      unsub();
    };
  }, [ticketId, options.isStaff]);

  return { isLive };
}
