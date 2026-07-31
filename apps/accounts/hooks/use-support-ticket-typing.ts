"use client";

import { useEffect, useRef, useState } from "react";
import {
  emitTicketTyping,
  joinSupportTicket,
  subscribeSupportSocket,
} from "@/lib/support-tickets-socket";

const TYPING_START_DELAY_MS = 400;
const TYPING_IDLE_MS = 2500;
const PEER_TYPING_TTL_MS = 3500;

type WindowTimer = number;

export function useSupportTicketTyping(
  ticketId: string | null,
  draft: string,
  options?: { enabled?: boolean; viewerIsStaff?: boolean },
) {
  const [peerTyping, setPeerTyping] = useState(false);
  const isEmittingTyping = useRef(false);
  const startTimerRef = useRef<WindowTimer | null>(null);
  const idleStopRef = useRef<WindowTimer | null>(null);
  const peerHideRef = useRef<WindowTimer | null>(null);
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!ticketId) return;

    const unsub = subscribeSupportSocket({
      onTyping: (payload) => {
        if (payload.ticketId !== ticketId) return;
        if (payload.isStaff === Boolean(options?.viewerIsStaff)) return;

        if (peerHideRef.current) {
          window.clearTimeout(peerHideRef.current);
          peerHideRef.current = null;
        }

        if (payload.isTyping) {
          setPeerTyping(true);
          peerHideRef.current = window.setTimeout(() => {
            setPeerTyping(false);
            peerHideRef.current = null;
          }, PEER_TYPING_TTL_MS);
        } else {
          setPeerTyping(false);
        }
      },
    });

    void joinSupportTicket(ticketId);

    return () => {
      if (peerHideRef.current) {
        window.clearTimeout(peerHideRef.current);
        peerHideRef.current = null;
      }
      setPeerTyping(false);
      unsub();
    };
  }, [ticketId, options?.viewerIsStaff]);

  useEffect(() => {
    if (!ticketId || !enabled) return;

    const clearStartTimer = () => {
      if (startTimerRef.current) {
        window.clearTimeout(startTimerRef.current);
        startTimerRef.current = null;
      }
    };

    const clearIdleStop = () => {
      if (idleStopRef.current) {
        window.clearTimeout(idleStopRef.current);
        idleStopRef.current = null;
      }
    };

    const stopTypingEmit = () => {
      if (!isEmittingTyping.current) return;
      emitTicketTyping(ticketId, false);
      isEmittingTyping.current = false;
      clearIdleStop();
    };

    const scheduleIdleStop = () => {
      clearIdleStop();
      idleStopRef.current = window.setTimeout(() => {
        stopTypingEmit();
      }, TYPING_IDLE_MS);
    };

    const hasText = draft.trim().length > 0;

    if (!hasText) {
      clearStartTimer();
      stopTypingEmit();
      return;
    }

    if (isEmittingTyping.current) {
      scheduleIdleStop();
      emitTicketTyping(ticketId, true);
      return;
    }

    clearStartTimer();
    startTimerRef.current = window.setTimeout(() => {
      emitTicketTyping(ticketId, true);
      isEmittingTyping.current = true;
      startTimerRef.current = null;
      scheduleIdleStop();
    }, TYPING_START_DELAY_MS);

    return () => {
      clearStartTimer();
    };
  }, [draft, ticketId, enabled]);

  useEffect(() => {
    return () => {
      if (startTimerRef.current) {
        window.clearTimeout(startTimerRef.current);
        startTimerRef.current = null;
      }
      if (idleStopRef.current) {
        window.clearTimeout(idleStopRef.current);
        idleStopRef.current = null;
      }
      if (ticketId && isEmittingTyping.current) {
        emitTicketTyping(ticketId, false);
        isEmittingTyping.current = false;
      }
    };
  }, [ticketId]);

  return { peerTyping };
}
