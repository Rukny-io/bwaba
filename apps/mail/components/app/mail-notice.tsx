"use client";

import type { ReactNode } from "react";
import { Alert, Button, CloseButton, cn } from "@heroui/react";

type MailNoticeStatus = "default" | "accent" | "success" | "warning" | "danger";

type MailNoticeAction = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "tertiary" | "danger" | "ghost";
};

export function MailNotice({
  status = "default",
  title,
  description,
  action,
  onDismiss,
  className,
  children,
}: {
  status?: MailNoticeStatus;
  title: string;
  description?: ReactNode;
  action?: MailNoticeAction;
  onDismiss?: () => void;
  className?: string;
  children?: ReactNode;
}) {
  const actionVariant =
    action?.variant ??
    (status === "danger" ? "danger" : status === "accent" ? "primary" : "secondary");

  return (
    <Alert
      status={status}
      className={cn(
        "items-start sm:items-center",
        onDismiss ? "pr-2.5" : null,
        className,
      )}
    >
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{title}</Alert.Title>
        {description ? (
          <Alert.Description>{description}</Alert.Description>
        ) : null}
        {children}
        {action ? (
          <Button
            size="sm"
            variant={actionVariant}
            className="mt-2.5 sm:hidden"
            onPress={action.onPress}
          >
            {action.label}
          </Button>
        ) : null}
      </Alert.Content>
      {action ? (
        <Button
          size="sm"
          variant={actionVariant}
          className="hidden shrink-0 sm:inline-flex"
          onPress={action.onPress}
        >
          {action.label}
        </Button>
      ) : null}
      {onDismiss ? (
        <CloseButton
          aria-label="Dismiss"
          className="shrink-0 self-start sm:self-center"
          onPress={onDismiss}
        />
      ) : null}
    </Alert>
  );
}
