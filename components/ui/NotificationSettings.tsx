import { User } from "@/types";
import React, { useEffect, useMemo, useState } from "react";
import Icon from "./Icon";
import { API } from "@/utils";
import { ExternalLink, LogOut, Send } from "lucide-react";
import {
  formatDistanceToNow,
  isValid,
  parseISO,
  format,
  differenceInSeconds,
} from "date-fns";

interface SettingsProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  showToast: (message: string, type?: "success" | "info" | "error") => void;
  updateUser: (updatedData: Partial<User>) => Promise<void> | void;
  loading: boolean;
}

type TelegramStep = "initial" | "generating" | "code" | "verifying";

const NotificationSettings: React.FC<SettingsProps> = ({
  user,
  setUser,
  showToast,
  loading,
}) => {
  const [telegramStep, setTelegramStep] = useState<TelegramStep>("initial");
  const [linkCode, setLinkCode] = useState("");
  const [botUsername, setBotUsername] = useState("TradeCompanionBot");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isTogglingTelegram, setIsTogglingTelegram] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(
    user?.notificationSettings?.email ?? false,
  );
  const [pushNotifications, setPushNotifications] = useState(
    user?.notificationSettings?.push ?? false,
  );
  const [telegramNotifications, setTelegramNotifications] = useState(
    user?.notificationSettings?.telegram ?? false,
  );

  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const isTelegramConnected = Boolean(user?.telegram?.chatId);

  useEffect(() => {
    setEmailNotifications(user?.notificationSettings?.email ?? false);
    setPushNotifications(user?.notificationSettings?.push ?? false);
    setTelegramNotifications(user?.notificationSettings?.telegram ?? false);
  }, [user?.notificationSettings]);

  useEffect(() => {
    if (user?.telegram?.chatId) {
      setTelegramStep("initial");
      setLinkCode("");
      setExpiresAt(null);
    }
  }, [user?.telegram?.chatId]);

  const shortTelegramId = useMemo(() => {
    const id = user?.telegram?.chatId;
    if (!id) return "";
    if (id.length <= 10) return id;
    return `${id.slice(0, 4)}••••${id.slice(-4)}`;
  }, [user?.telegram?.chatId]);

  const linkCommand = useMemo(() => {
    return linkCode ? `/link ${linkCode}` : "";
  }, [linkCode]);

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return null;

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return null;

    return date.toLocaleString();
  };

  const handleGenerateTelegramCode = async () => {
    try {
      setTelegramStep("generating");

      const res = await API.post("/api/telegram/create-link-code");

      setLinkCode(res.data?.code || "");
      setBotUsername(res.data?.botUsername || "TradeCompanionBot");
      setExpiresAt(res.data?.expiresAt || null);
      setTelegramStep("code");
    } catch (error) {
      setTelegramStep("initial");
      showToast("Failed to generate Telegram link code.", "error");
    }
  };

  const parseDateSafe = (dateString?: string | null) => {
    if (!dateString) return null;

    const date = parseISO(dateString);
    return isValid(date) ? date : null;
  };

  const formatExactDateTime = (dateString?: string | null) => {
    const date = parseDateSafe(dateString);
    if (!date) return "";

    return format(date, "MMM d, yyyy • h:mm a");
  };

  const formatRelativeDateTime = (dateString?: string | null) => {
    const date = parseDateSafe(dateString);
    if (!date) {
      return {
        relative: "Just now",
        absolute: "",
      };
    }

    return {
      relative: formatDistanceToNow(date, { addSuffix: true }),
      absolute: format(date, "MMM d, yyyy"),
    };
  };

  const linkedDate = formatRelativeDateTime(user?.telegram?.linkedAt);

  const formatExpiry = (dateString?: string | null) => {
    if (!dateString) return "";

    const date = parseISO(dateString);
    if (!isValid(date)) return "";

    const seconds = differenceInSeconds(date, new Date());

    if (seconds <= 0) return "Expired";

    const minutes = Math.ceil(seconds / 60);

    if (minutes < 60) {
      return `Expires in ${minutes} minute${minutes > 1 ? "s" : ""}`;
    }

    const hours = Math.ceil(minutes / 60);
    return `Expires in ${hours} hour${hours > 1 ? "s" : ""}`;
  };
  const handleVerifyTelegramConnection = async () => {
    try {
      setTelegramStep("verifying");

      const res = await API.get("/api/telegram/status");

      if (!res.data?.connected || !res.data?.telegram?.chatId) {
        setTelegramStep("code");
        showToast(
          "Telegram not linked yet. Complete linking in the bot first.",
          "info",
        );
        return;
      }

      setUser({
        telegram: {
          chatId: res.data.telegram.chatId ?? null,
          username: res.data.telegram.username ?? null,
          linkedAt: res.data.telegram.linkedAt ?? null,
        },
        notificationSettings: {
          telegram: res.data?.notificationSettings?.telegram ?? true,
        },
      });

      setTelegramStep("initial");
      setLinkCode("");
      setExpiresAt(null);

      showToast("Telegram connected successfully!", "success");
    } catch (error) {
      setTelegramStep("code");
      showToast("Failed to verify Telegram connection.", "error");
    }
  };
  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);

      await API.delete("/api/telegram/disconnect");

      setUser({
        telegram: {
          chatId: null,
          username: null,
          linkedAt: null,
        },
        notificationSettings: {
          telegram: false,
        },
      });

      setTelegramStep("initial");
      setLinkCode("");
      setExpiresAt(null);

      showToast("Telegram disconnected.", "info");
    } catch (error) {
      showToast("Failed to disconnect Telegram.", "error");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleCopyCommand = async () => {
    if (!linkCommand) return;

    try {
      await navigator.clipboard.writeText(linkCommand);
      showToast("Telegram link command copied.", "success");
    } catch (error) {
      showToast("Failed to copy command.", "error");
    }
  };

  const handleToggleEmail = async () => {
    const next = !emailNotifications;
    setEmailNotifications(next);

    try {
      await setUser({
        notificationSettings: {
          ...user?.notificationSettings,
          email: next,
        } as User["notificationSettings"],
      });
    } catch (error) {
      setEmailNotifications(!next);
      showToast("Failed to update email notifications.", "error");
    }
  };

  const handleTogglePush = async () => {
    const next = !pushNotifications;
    setPushNotifications(next);

    try {
      await setUser({
        notificationSettings: {
          ...user?.notificationSettings,
          push: next,
        } as User["notificationSettings"],
      });
    } catch (error) {
      setPushNotifications(!next);
      showToast("Failed to update push notifications.", "error");
    }
  };

  const handleToggleTelegram = async () => {
    if (!isTelegramConnected) {
      showToast("Connect Telegram first before enabling alerts.", "info");
      return;
    }

    if (isTogglingTelegram) return;

    const next = !telegramNotifications;
    setTelegramNotifications(next);
    setIsTogglingTelegram(true);

    try {
      const res = await API.post("/api/telegram/toggle-notification", {
        enabled: next,
      });

      setUser({
        notificationSettings: {
          telegram: res.data?.notificationSettings?.telegram ?? next,
        },
      });

      showToast(
        next
          ? "Telegram notifications enabled."
          : "Telegram notifications disabled.",
        next ? "success" : "info",
      );
    } catch (error) {
      console.log(error);
      setTelegramNotifications(!next);
      showToast("Failed to update Telegram notifications.", "error");
    } finally {
      setIsTogglingTelegram(false);
    }
  };

  const Toggle = ({
    checked,
    onChange,
    disabled,
    loading,
  }: {
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
    loading?: boolean;
  }) => (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-pressed={checked}
      aria-busy={loading}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 ${
        checked ? "bg-primary shadow-sm" : "bg-gray-300"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      >
        {loading && (
          <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        )}
      </span>
    </button>
  );

  const PreferenceCard = ({
    title,
    description,
    checked,
    onChange,
    disabled,
    icon,
  }: {
    title: string;
    description: string;
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
    icon: string;
  }) => (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-light-gray bg-light-bg px-4 py-4 transition hover:border-primary/20 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon name={icon} className="h-5 w-5" />
        </div>

        <div>
          <p className="font-semibold text-dark-text">{title}</p>
          <p className="mt-1 text-sm text-mid-text">{description}</p>
        </div>
      </div>

      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );

  return (
    <div className="space-y-6 rounded-3xl border border-light-gray bg-light-surface p-6 shadow-sm md:p-7">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-dark-text">
          Notification Preferences
        </h3>
        <p className="text-sm text-mid-text">
          Choose how you want to receive signals, updates, and important account
          activity.
        </p>
      </div>

      <div className="grid gap-4">
        <PreferenceCard
          title="Email Notifications"
          description="Receive updates and important activity directly in your inbox."
          checked={emailNotifications}
          onChange={handleToggleEmail}
          disabled={loading}
          icon="mail"
        />

        <PreferenceCard
          title="Push Notifications"
          description="Get instant in-app alerts in real time while using Trade Companion."
          checked={pushNotifications}
          onChange={handleTogglePush}
          disabled={loading}
          icon="bell"
        />
      </div>

      <div className="border-t border-light-gray pt-6">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-info/10 text-info">
              <Icon name="send" className="h-5 w-5" />
            </div>

            <div>
              <h4 className="text-base font-bold text-dark-text">
                Telegram Alerts
              </h4>
              <p className="mt-1 text-sm text-mid-text">
                Receive trading signals and important updates directly on
                Telegram.
              </p>
            </div>
          </div>

          <span
            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
              isTelegramConnected
                ? "border border-success/20 bg-success/10 text-success"
                : "border border-yellow-500/20 bg-yellow-500/10 text-yellow-700"
            }`}
          >
            {isTelegramConnected ? "Connected" : "Not connected"}
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 rounded-2xl border border-light-gray bg-light-bg px-4 py-4">
            <div>
              <p className="font-semibold text-dark-text">
                Enable Telegram Notifications
              </p>
              <p className="mt-1 text-sm text-mid-text">
                Turn Telegram trade alerts on or off.
              </p>
            </div>

            <Toggle
              checked={telegramNotifications}
              onChange={handleToggleTelegram}
              disabled={loading || isTogglingTelegram}
              loading={isTogglingTelegram}
            />
          </div>

          {!isTelegramConnected ? (
            <div className="rounded-3xl border border-dashed border-light-gray bg-gradient-to-br from-light-bg to-light-surface p-5 md:p-6">
              {telegramStep === "initial" && (
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-info/10 text-info">
                    <Icon name="send" className="h-7 w-7" />
                  </div>

                  <h5 className="text-lg font-bold text-dark-text">
                    Connect your Telegram
                  </h5>
                  <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-mid-text">
                    Generate a secure code, send it to the bot, and verify your
                    Telegram connection in seconds.
                  </p>

                  <button
                    onClick={handleGenerateTelegramCode}
                    disabled={loading}
                    className="mt-5 rounded-xl bg-info px-5 py-2.5 font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Generate Link Code
                  </button>
                </div>
              )}

              {telegramStep === "generating" && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-info/10 text-info">
                    <Icon name="send" className="h-6 w-6 animate-pulse" />
                  </div>
                  <p className="font-semibold text-dark-text">
                    Generating your secure code...
                  </p>
                  <p className="mt-1 text-sm text-mid-text">
                    Please wait a moment.
                  </p>
                </div>
              )}

              {(telegramStep === "code" || telegramStep === "verifying") && (
                <div className="animate-fade-in-right space-y-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-light-gray bg-light-surface p-4">
                      <p className="mb-2 text-sm font-bold text-primary">
                        Step 1
                      </p>
                      <p className="text-sm font-medium text-dark-text">
                        Open the bot
                      </p>
                      <p className="mt-1 text-xs leading-5 text-mid-text">
                        Search for{" "}
                        <span className="font-mono text-primary">
                          @{botUsername}
                        </span>{" "}
                        on Telegram and press Start.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-light-gray bg-light-surface p-4">
                      <p className="mb-2 text-sm font-bold text-primary">
                        Step 2
                      </p>
                      <p className="text-sm font-medium text-dark-text">
                        Send your code
                      </p>
                      <p className="mt-1 text-xs leading-5 text-mid-text">
                        Copy the command below and send it directly to the bot.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-light-gray bg-light-surface p-4">
                      <p className="mb-2 text-sm font-bold text-primary">
                        Step 3
                      </p>
                      <p className="text-sm font-medium text-dark-text">
                        Verify connection
                      </p>
                      <p className="mt-1 text-xs leading-5 text-mid-text">
                        Return here after the bot confirms your account is
                        linked.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-light-gray bg-light-surface p-4">
                    <a
                      href={`https://t.me/${botUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                    >
                      <Icon name="link" className="mr-2 h-4 w-4" />
                      Open Telegram Bot
                    </a>

                    <div className="rounded-2xl border border-primary/15 bg-light-bg p-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                        Link command
                      </p>

                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <code className="block overflow-x-auto rounded-xl bg-transparent px-4 py-3 text-sm font-semibold ">
                          {linkCommand}
                        </code>

                        <button
                          onClick={handleCopyCommand}
                          className="rounded-xl border border-light-gray px-4 py-2 text-sm font-medium text-dark-text transition hover:bg-light-hover"
                        >
                          Copy Command
                        </button>
                      </div>

                      {expiresAt && (
                        <p className="mt-3 text-xs text-mid-text">
                          {formatExpiry(expiresAt)}
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-light-gray bg-light-bg p-4">
                      <p className="text-sm font-semibold text-dark-text">
                        What to send in Telegram
                      </p>
                      <p className="mt-1 text-sm text-mid-text">
                        Paste this exact command into the bot chat:
                      </p>
                      <code className="mt-3 block rounded-xl bg-transparent px-4 py-3 text-sm font-semibold text-primary shadow-sm">
                        {linkCommand}
                      </code>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-1">
                      <button
                        onClick={handleVerifyTelegramConnection}
                        disabled={telegramStep === "verifying" || loading}
                        className="rounded-xl bg-success px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {telegramStep === "verifying"
                          ? "Verifying..."
                          : "I've Linked My Telegram"}
                      </button>

                      <button
                        onClick={handleGenerateTelegramCode}
                        disabled={telegramStep === "verifying" || loading}
                        className="rounded-xl border border-light-gray px-5 py-2.5 text-sm text-mid-text transition hover:bg-light-hover disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Generate New Code
                      </button>

                      <button
                        onClick={() => {
                          setTelegramStep("initial");
                          setLinkCode("");
                          setExpiresAt(null);
                        }}
                        disabled={telegramStep === "verifying"}
                        className="rounded-xl border border-light-gray px-5 py-2.5 text-sm text-mid-text transition hover:bg-light-hover disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="group relative overflow-hidden rounded-2xl border border-light-gray bg-light-bg p-6 shadow-sm transition-all hover:shadow-md ">
              <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-success/10 blur-3xl opacity-60" />

              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                    <Send
                      size={22}
                      fill="currentColor"
                      className="opacity-90"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-success">
                        Telegram Connected
                      </p>
                    </div>

                    <p className="text-lg font-bold text-dark-text leading-tight">
                      {user?.telegram?.username
                        ? `@${user.telegram.username}`
                        : "Telegram Account"}
                    </p>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mid-text">
                      <span className="font-mono">
                        ID:{" "}
                        <span className="text-dark-text/70">
                          {shortTelegramId}
                        </span>
                      </span>

                      {user?.telegram?.linkedAt && (
                        <span>
                          • Linked {linkedDate.relative}
                          {linkedDate.absolute
                            ? ` • ${linkedDate.absolute}`
                            : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
 
                <div className="flex items-center gap-2 sm:self-center">
                  <a
                    href={`https://t.me/${botUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-light-gray bg-light-bg px-4 py-2.5 text-sm font-semibold text-dark-text transition hover:bg-light-hover"
                  >
                    Open Bot
                    <ExternalLink size={14} />
                  </a>

                  <button
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                    className="inline-flex items-center gap-2 rounded-lg bg-danger/10 px-4 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger/20 disabled:opacity-50"
                  >
                    {isDisconnecting ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-danger border-t-transparent" />
                        Disconnecting...
                      </>
                    ) : (
                      <>
                        <LogOut size={16} />
                        Disconnect
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
