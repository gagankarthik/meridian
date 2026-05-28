import { Star } from "lucide-react";
import { TESTIMONIALS } from "@/lib/site";
import { Avatar } from "@/components/app/widgets";
import { Eyebrow, Reveal, RevealItem, Section, Stagger } from "./primitives";

const HUES = ["#2563eb", "#22a06b", "#7a3ff0", "#e2a200"];

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
}

export function Testimonials() {
  return (
    <Section id="testimonials" className="scroll-mt-20 py-20 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="mt-5 font-display text-[clamp(2rem,4.2vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink text-balance">
          Teams ship more with Meridian.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[17px] leading-relaxed text-ink-muted text-pretty">
          Don’t take our word for it — here’s what operators running real
          programs say after switching.
        </p>
      </Reveal>

      <Stagger className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2" stagger={0.1}>
        {TESTIMONIALS.map((t, i) => (
          <RevealItem
            key={t.name}
            className="flex h-full flex-col rounded-2xl border border-line bg-card p-7 shadow-card transition-[box-shadow,border-color] duration-300 hover:border-ink/15 hover:shadow-raised sm:p-8"
          >
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map((s) => (
                <Star key={s} className="size-4 text-[#f5a623]" fill="#f5a623" strokeWidth={0} />
              ))}
            </div>
            <blockquote className="mt-4 flex-1 text-[clamp(1.05rem,1.6vw,1.3rem)] font-semibold leading-relaxed tracking-[-0.01em] text-ink text-pretty">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
              <Avatar initials={initials(t.name)} hue={HUES[i % HUES.length]} size={42} />
              <div>
                <p className="text-[14px] font-bold text-ink">{t.name}</p>
                <p className="text-[12.5px] text-ink-soft">
                  {t.role} · {t.company}
                </p>
              </div>
            </figcaption>
          </RevealItem>
        ))}
      </Stagger>
    </Section>
  );
}
