"use client";

import { useRef, useState } from "react";
import { updateUserAttributes } from "aws-amplify/auth";
import { Camera, Check } from "lucide-react";
import { Avatar } from "@/components/app/widgets";
import { useWorkspace } from "@/components/app/workspace";
import { cognitoConfigured } from "@/lib/cognito";
import { downscaleImage } from "@/lib/image";

export default function ProfilePage() {
  const ws = useWorkspace();
  const record = ws.members.find((m) => m.id === ws.me.id);
  const me = {
    name: ws.me.name || record?.name || "You",
    email: ws.me.email || record?.email || "",
    role: ws.me.role || record?.role || "Member",
    initials:
      record?.initials ?? (ws.me.name || "You").slice(0, 2).toUpperCase(),
    hue: record?.hue ?? "#2563eb",
  };
  const [name, setName] = useState(me.name);
  const [email, setEmail] = useState(me.email);
  const [title, setTitle] = useState("");
  const [tz, setTz] = useState("America/New_York");
  const [bio, setBio] = useState("");
  // Existing saved photo (if any) shows until a new one is picked.
  const [photo, setPhoto] = useState<string | null>(record?.avatar ?? null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Downscale to a compact data URL so the avatar persists cleanly.
    setPhoto(await downscaleImage(file, 160));
  }

  function save() {
    ws.updateProfile({
      name: name.trim() || me.name,
      ...(photo ? { avatar: photo } : {}),
    });
    // Keep the Cognito name attribute in sync (best-effort).
    if (cognitoConfigured && name.trim()) {
      void updateUserAttributes({
        userAttributes: { name: name.trim() },
      }).catch(() => {});
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  }

  return (
    <div className="max-w-[820px] p-5 sm:p-6 lg:p-8">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
        Profile
      </h1>
      <p className="mt-1.5 text-[14px] text-ink-muted">
        Manage how you appear across the workspace.
      </p>

      <div className="mt-6 space-y-6">
        <section className="rounded-2xl border border-line bg-card p-6 shadow-card">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar
                initials={me.initials}
                hue={me.hue}
                seed={me.initials}
                src={photo ?? undefined}
                size={72}
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onPhoto}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Upload profile photo"
                className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border border-line bg-card text-ink-muted shadow-card transition-colors hover:text-ink"
              >
                <Camera className="size-3.5" />
              </button>
            </div>
            <div>
              <p className="font-display text-xl font-bold text-ink">
                {name || "Your name"}
              </p>
              <p className="text-[13px] text-ink-soft">
                {title ? `${title} · ${me.role}` : me.role}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name" value={name} onChange={setName} placeholder="e.g. Avery Quinn" />
            <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@company.com" />
            <Field label="Job title" value={title} onChange={setTitle} placeholder="e.g. Product Manager" />
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">
                Timezone
              </label>
              <select
                value={tz}
                onChange={(e) => setTz(e.target.value)}
                className="w-full rounded-xl border border-line bg-paper-raised px-3 py-2.5 text-[14px] text-ink outline-none focus:border-signal/40"
              >
                <option>America/New_York</option>
                <option>America/Los_Angeles</option>
                <option>Europe/London</option>
                <option>Asia/Kolkata</option>
                <option>Asia/Singapore</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="A short bio — what you work on and how you like to collaborate."
              className="w-full resize-none rounded-xl border border-line bg-paper-raised px-3 py-2.5 text-[14px] leading-relaxed text-ink outline-none placeholder:text-ink-soft focus:border-signal/40"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-green">
                <Check className="size-4" /> Saved
              </span>
            )}
            <button
              onClick={save}
              className="rounded-xl bg-signal px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-signal-strong"
            >
              Save changes
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line bg-paper-raised px-3 py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-soft focus:border-signal/40"
      />
    </div>
  );
}
