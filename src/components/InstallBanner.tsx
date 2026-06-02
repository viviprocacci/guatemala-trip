import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

const DISMISS_KEY = "guatemala-install-dismissed";

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;
    if (isStandalone()) return;
    setVisible(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const install = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      dismiss();
      return;
    }
  };

  return (
    <aside className="install-banner">
      <button type="button" className="install-dismiss" onClick={dismiss} aria-label="Dismiss">
        <X size={16} />
      </button>
      <div className="install-content">
        <Download size={20} strokeWidth={1.5} />
        <div>
          <strong>Use on your phone</strong>
          {isIOS() ? (
            <p>
              Tap <Share size={12} style={{ verticalAlign: "middle" }} /> Share, then{" "}
              <strong>Add to Home Screen</strong>. Works offline after the first load. No
              computer needed.
            </p>
          ) : deferredPrompt ? (
            <p>
              Install like an app for offline access. No server required after setup.
              <button type="button" className="install-cta" onClick={install}>
                Install app
              </button>
            </p>
          ) : (
            <p>
              Deploy once to free hosting (Netlify/Vercel), open on your phone, then Add to Home
              Screen. Itinerary & bookings work offline.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}
