"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, Check } from "lucide-react";
import { useWorkspace } from "@/components/app/workspace";
import { downscaleImage } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_PREFERENCES,
  applyTheme,
  loadPreferences,
  savePreferences,
  type NotificationPrefs,
  type Preferences,
  type ThemePref,
} from "@/lib/preferences";
import { cn } from "@/lib/utils";

const ADMIN_ROLES = new Set(["Owner", "Admin", "owner", "admin"]);

function Row({
  title,
  desc,
  htmlFor,
  children,
}: {
  title: string;
  desc: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <Label htmlFor={htmlFor} className="text-[14px] font-semibold text-ink">
          {title}
        </Label>
        <p className="mt-0.5 text-[12.5px] text-ink-soft">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-6 shadow-card">
      <h2 className="text-[15px] font-bold tracking-tight text-ink">{title}</h2>
      <div className="mt-2 divide-y divide-line">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const ws = useWorkspace();
  const isAdmin = ADMIN_ROLES.has(ws.me.role);

  // Preferences — load from localStorage after mount to avoid hydration drift.
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  useEffect(() => {
    setPrefs(loadPreferences());
  }, []);

  function update(patch: Partial<Preferences>) {
    setPrefs((p) => {
      const next = { ...p, ...patch };
      savePreferences(next);
      if (patch.theme) applyTheme(patch.theme);
      return next;
    });
  }
  function updateNotif(patch: Partial<NotificationPrefs>) {
    setPrefs((p) => {
      const next = { ...p, notif: { ...p.notif, ...patch } };
      savePreferences(next);
      return next;
    });
  }

  // Organisation (admin only)
  const [orgName, setOrgName] = useState(ws.workspace.name);
  const [company, setCompany] = useState(ws.workspace.company ?? "");
  const [savedOrg, setSavedOrg] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compact = await downscaleImage(file, 256);
    await ws.uploadWorkspaceLogo(compact);
  }

  function saveOrg() {
    ws.updateWorkspace({ name: orgName.trim() || "Workspace", company: company.trim() });
    setSavedOrg(true);
    setTimeout(() => setSavedOrg(false), 2400);
  }

  const themes: ThemePref[] = ["system", "light", "dark"];

  return (
    <div className="max-w-[820px] p-5 sm:p-6 lg:p-8">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">
        {ws.workspace.name}
      </p>
      <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-ink">
        Settings
      </h1>
      <p className="mt-1.5 text-[14px] text-ink-muted">
        Configure notifications, appearance{isAdmin ? ", and your organisation" : ""}.
      </p>

      <div className="mt-6 space-y-6">
        <Card title="Notifications">
          <Row htmlFor="notif-digest" title="Weekly email digest" desc="A Monday summary of your work.">
            <Switch
              id="notif-digest"
              checked={prefs.notif.digest}
              onCheckedChange={(v) => updateNotif({ digest: v })}
            />
          </Row>
          <Row htmlFor="notif-mentions" title="Mentions" desc="When someone @mentions you.">
            <Switch
              id="notif-mentions"
              checked={prefs.notif.mentions}
              onCheckedChange={(v) => updateNotif({ mentions: v })}
            />
          </Row>
          <Row htmlFor="notif-assigned" title="Task assignments" desc="When a task is assigned to you.">
            <Switch
              id="notif-assigned"
              checked={prefs.notif.assigned}
              onCheckedChange={(v) => updateNotif({ assigned: v })}
            />
          </Row>
          <Row htmlFor="notif-approvals" title="Approvals" desc="When your approval is requested.">
            <Switch
              id="notif-approvals"
              checked={prefs.notif.approvals}
              onCheckedChange={(v) => updateNotif({ approvals: v })}
            />
          </Row>
        </Card>

        <Card title="Appearance">
          <Row title="Theme" desc="How Meridian looks on this device.">
            <div className="inline-flex rounded-xl border border-line bg-paper-raised p-1">
              {themes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => update({ theme: t })}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-[12.5px] font-semibold capitalize transition-colors",
                    prefs.theme === t
                      ? "bg-signal text-white"
                      : "text-ink-muted hover:text-ink",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </Row>
          <Row htmlFor="default-view" title="Default project view" desc="Where projects open by default.">
            <select
              id="default-view"
              value={prefs.defaultView}
              onChange={(e) => update({ defaultView: e.target.value })}
              className="rounded-xl border border-line bg-paper-raised px-3 py-2 text-[13px] font-medium text-ink outline-none focus:border-signal/40"
            >
              <option value="board">Board</option>
              <option value="table">Table</option>
              <option value="timeline">Timeline</option>
              <option value="summary">Overview</option>
            </select>
          </Row>
        </Card>

        {/* Organisation — owners & admins only */}
        {isAdmin ? (
          <section className="rounded-2xl border border-line bg-card p-6 shadow-card">
            <h2 className="inline-flex items-center gap-2 text-[15px] font-bold tracking-tight text-ink">
              <Building2 className="size-4 text-signal" strokeWidth={1.9} />
              Organisation
            </h2>
            <p className="mt-1 text-[12.5px] text-ink-soft">
              Visible to everyone in your workspace. Only owners and admins can
              change these.
            </p>

            <div className="mt-2 divide-y divide-line">
              <Row title="Company logo" desc="Shown in the top bar.">
                <div className="flex items-center gap-3">
                  <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-line-strong bg-paper-raised text-[16px] font-bold text-ink-soft shadow-card">
                    {ws.workspace.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ws.workspace.logo} alt="" className="size-full object-cover" />
                    ) : (
                      (ws.workspace.name || "W").slice(0, 1).toUpperCase()
                    )}
                  </span>
                  <input
                    ref={logoRef}
                    type="file"
                    accept="image/*"
                    onChange={onLogo}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => logoRef.current?.click()}
                  >
                    Upload
                  </Button>
                </div>
              </Row>
              <Row htmlFor="org-name" title="Organisation name" desc="Your workspace name.">
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="h-9 w-56 rounded-xl"
                />
              </Row>
              <Row htmlFor="org-company" title="Company" desc="Legal or trading name.">
                <Input
                  id="org-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Inc."
                  className="h-9 w-56 rounded-xl"
                />
              </Row>
              <Row title="Plan" desc="Business — billed annually.">
                <span className="rounded-md bg-signal-soft px-2.5 py-1 text-[12px] font-bold text-signal">
                  Business
                </span>
              </Row>
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              {savedOrg && (
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-green">
                  <Check className="size-4" /> Saved
                </span>
              )}
              <Button
                type="button"
                onClick={saveOrg}
                className="h-9 rounded-xl bg-signal px-5 font-bold text-white hover:bg-signal-strong"
              >
                Save organisation
              </Button>
            </div>
          </section>
        ) : (
          /* Read-only organisation details for non-admins */
          <Card title="Organisation">
            <Row title="Organisation name" desc="The workspace you belong to.">
              <span className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg border border-line-strong bg-paper-raised text-[12px] font-bold text-ink-soft">
                  {ws.workspace.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ws.workspace.logo} alt="" className="size-full object-cover" />
                  ) : (
                    (ws.workspace.name || "W").slice(0, 1).toUpperCase()
                  )}
                </span>
                {ws.workspace.name}
              </span>
            </Row>
            {ws.workspace.company ? (
              <Row title="Company" desc="Registered company name.">
                <span className="text-[13px] font-medium text-ink">
                  {ws.workspace.company}
                </span>
              </Row>
            ) : null}
            <Row title="Your role" desc="Granted by your administrator.">
              <span className="rounded-md bg-secondary px-2.5 py-1 text-[12px] font-bold capitalize text-ink-muted">
                {ws.me.role}
              </span>
            </Row>
          </Card>
        )}
      </div>
    </div>
  );
}
