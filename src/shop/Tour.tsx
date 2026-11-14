import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { TOUR, type TourClick } from './tourSteps';

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * What the tour does now.
 * show: one part of the page is bright, and the card explains it.
 * walk: a drawn cursor clicks the way to the next step (wide screens).
 * guide: the tour asks the reader to tap the way to the next step (phones).
 */
type Mode = 'show' | 'walk' | 'guide';

const PAD = 8;
const GAP = 14;
const EDGE = 16;

function sameBox(a: Box | null, b: Box | null): boolean {
  if (!a || !b) return a === b;
  return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;
}

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const isVisible = (el: Element | null): el is HTMLElement =>
  el instanceof HTMLElement && el.getClientRects().length > 0;
const media = (query: string) => typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
const reducedMotion = () => media('(prefers-reduced-motion: reduce)');
/** The cursor needs animation. Without it, "Next" opens the next step at once. */
const canAnimate = () => typeof window.matchMedia === 'function' && !reducedMotion();
/** At this width the side menu is closed behind the menu button. */
const isPhone = () => media('(max-width: 800px)');

/** On a phone the menu is closed, so the reader must tap the menu button first. */
function controlToTap(click: TourClick): { el: HTMLElement | null; isMenuButton: boolean } {
  const el = click.find();
  if (isVisible(el)) return { el, isMenuButton: false };
  const burger = document.querySelector<HTMLElement>('.burger');
  if (el && isVisible(burger)) return { el: burger, isMenuButton: true };
  return { el: null, isMenuButton: false };
}

/**
 * The guided tour. Each step keeps one part of the page bright, makes the
 * rest dark, and points a small card at the bright part. The page under the
 * tour still works, so the reader can click what the card talks about.
 *
 * Between two steps the tour shows the way: on a wide screen a drawn cursor
 * clicks the real controls, and on a phone the reader taps them.
 */
export default function Tour({
  index,
  onGo,
  onArrive,
  onEnd,
}: {
  index: number;
  /** Opens a step directly, with no path. */
  onGo: (index: number) => void;
  /** Called when the clicks of the path are done and the page of the step should be open. */
  onArrive: (index: number) => void;
  onEnd: () => void;
}) {
  const step = TOUR[index];
  const path = TOUR[index + 1]?.path ?? [];
  const [mode, setMode] = useState<Mode>('show');
  /** The click of the path that is next, in walk and guide mode. */
  const [hop, setHop] = useState(0);
  const [menuButton, setMenuButton] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; press: boolean } | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  /** The purchase pages cover the whole window, so the tour waits behind them. */
  const [covered, setCovered] = useState(false);
  const [place, setPlace] = useState<{ top: number; left: number; side: 'above' | 'below' | 'none' }>({
    top: 0,
    left: EDGE,
    side: 'none',
  });
  const card = useRef<HTMLDivElement>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);
  /** Each walk gets a number. A walk stops when the number changes. */
  const walkId = useRef(0);

  useEffect(
    () => () => {
      walkId.current += 1;
    },
    [],
  );

  // Follow the bright part: it can move, load late, or change size.
  useEffect(() => {
    if (mode === 'walk') return;
    let scrolledTo: Element | null = null;
    const measure = () => {
      setCovered(Boolean(document.querySelector('.flow-page')));
      let el: Element | null;
      if (mode === 'guide') {
        const tap = controlToTap(path[hop]);
        el = tap.el;
        setMenuButton(tap.isMenuButton);
      } else {
        el = document.querySelector(step.target);
      }
      if (!el) {
        setBox((old) => (old ? null : old));
        return;
      }
      if (scrolledTo !== el) {
        scrolledTo = el;
        // Leave room for the card above the part. A part that is too tall goes to the top.
        const r = el.getBoundingClientRect();
        const room = (card.current?.offsetHeight ?? 230) + GAP + PAD + EDGE;
        const top = r.height + room + EDGE <= window.innerHeight ? room : EDGE + PAD;
        if (el instanceof HTMLElement && el.scrollIntoView) {
          const before = el.style.scrollMarginTop;
          el.style.scrollMarginTop = `${top}px`;
          el.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
          el.style.scrollMarginTop = before;
        }
      }
      const r = el.getBoundingClientRect();
      const next = {
        top: Math.round(r.top),
        left: Math.round(r.left),
        width: Math.round(r.width),
        height: Math.round(r.height),
      };
      setBox((old) => (sameBox(old, next) ? old : next));
    };
    measure();
    const timer = window.setInterval(measure, 200);
    window.addEventListener('scroll', measure, { passive: true, capture: true });
    window.addEventListener('resize', measure);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('scroll', measure, { capture: true });
      window.removeEventListener('resize', measure);
    };
    // The path belongs to the step, so the step index covers it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, mode, hop]);

  // Put the card above the bright part, or below it, or at the bottom of the window.
  useLayoutEffect(() => {
    const el = card.current;
    if (!el) return;
    const h = el.offsetHeight;
    const w = el.offsetWidth;
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const bottom = {
      top: Math.max(EDGE, vh - h - EDGE),
      left: Math.max(EDGE, (vw - w) / 2),
      side: 'none' as const,
    };
    let next: typeof place = bottom;
    if (box) {
      const left = Math.min(Math.max(EDGE, box.left + 8), Math.max(EDGE, vw - w - EDGE));
      const above = box.top - PAD - GAP - h;
      const below = box.top + box.height + PAD + GAP;
      if (above >= EDGE) next = { top: above, left, side: 'above' };
      else if (below + h <= vh - EDGE) next = { top: below, left, side: 'below' };
    }
    setPlace((old) =>
      old.top === next.top && old.left === next.left && old.side === next.side ? old : next,
    );
  }, [box, index, covered, mode, hop, menuButton]);

  useEffect(() => {
    card.current?.focus({ preventScroll: true });
  }, [index, mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('.flow-page')) onEnd();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onEnd]);

  // Phones: the tour goes on when the reader taps the bright control.
  useEffect(() => {
    if (mode !== 'guide') return;
    const onClick = (e: MouseEvent) => {
      const tap = controlToTap(path[hop]);
      if (!tap.el || !(e.target instanceof Node) || !tap.el.contains(e.target)) return;
      // The menu button only opens the menu. The control of the path comes after it.
      if (tap.isMenuButton) return;
      window.setTimeout(() => {
        if (hop + 1 < path.length) {
          setHop(hop + 1);
        } else {
          setMode('show');
          setHop(0);
          onArrive(index + 1);
        }
      }, 350);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, hop, index]);

  /** Wide screens: a drawn cursor clicks each control of the path. */
  const walk = async () => {
    const id = ++walkId.current;
    const stopped = () => walkId.current !== id;
    const from = nextBtn.current?.getBoundingClientRect();
    setCursor({
      x: from ? from.left + from.width / 2 : window.innerWidth / 2,
      y: from ? from.top + from.height / 2 : window.innerHeight / 2,
      press: false,
    });
    setMode('walk');
    await sleep(150);
    for (const click of path) {
      let el: HTMLElement | null = null;
      for (let tries = 0; tries < 25 && !isVisible(el); tries += 1) {
        if (stopped()) return;
        el = click.find();
        if (!isVisible(el)) await sleep(100);
      }
      if (stopped()) return;
      if (!isVisible(el)) {
        // The control is not on the page. Open the step directly.
        setCursor(null);
        setMode('show');
        onGo(index + 1);
        return;
      }
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      await sleep(400);
      if (stopped()) return;
      const r = el.getBoundingClientRect();
      setCursor({ x: r.left + Math.min(r.width / 2, 90), y: r.top + r.height / 2, press: false });
      await sleep(800);
      if (stopped()) return;
      setCursor((c) => (c ? { ...c, press: true } : c));
      await sleep(220);
      if (stopped()) return;
      el.click();
      setCursor((c) => (c ? { ...c, press: false } : c));
      await sleep(550);
    }
    if (stopped()) return;
    setCursor(null);
    setMode('show');
    onArrive(index + 1);
  };

  const next = () => {
    if (path.length === 0) onArrive(index + 1);
    else if (isPhone()) {
      setHop(0);
      setMode('guide');
    } else if (canAnimate()) void walk();
    else onGo(index + 1);
  };

  const jump = (to: number) => {
    walkId.current += 1;
    setCursor(null);
    setMode('show');
    setHop(0);
    onGo(to);
  };

  if (covered) return null;
  const last = index === TOUR.length - 1;
  const guide = mode === 'guide';

  return (
    <>
      {box && mode !== 'walk' && (
        <div
          className="tour-hole"
          aria-hidden="true"
          style={{
            top: box.top - PAD,
            left: box.left - PAD,
            width: box.width + PAD * 2,
            height: box.height + PAD * 2,
          }}
        />
      )}
      {cursor && (
        <div
          className={`tour-cursor${cursor.press ? ' is-press' : ''}`}
          aria-hidden="true"
          style={{ translate: `${Math.round(cursor.x)}px ${Math.round(cursor.y)}px` }}
        >
          <svg viewBox="0 0 24 24" width="28" height="28">
            <path
              d="M5 3l14 8.2-6.3 1.5L9.6 19 5 3z"
              fill="#0a0a0a"
              stroke="#ffffff"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
      <div
        ref={card}
        className={`tour-card is-${place.side}${mode === 'walk' ? ' is-away' : ''}`}
        role="dialog"
        aria-labelledby="tour-title"
        aria-describedby="tour-text"
        tabIndex={-1}
        style={{ top: place.top, left: place.left }}
      >
        <p className="tour-top">
          <span>
            Phase {step.phase}, step {index + 1} of {TOUR.length}
          </span>
          <button className="link" onClick={onEnd}>
            End the tour
          </button>
        </p>
        {guide ? (
          <>
            <h2 id="tour-title">Tap {menuButton ? 'the menu button' : path[hop].name}</h2>
            <p id="tour-text">
              {menuButton
                ? `The menu opens. Then tap ${path[hop].name}.`
                : `A customer goes this way to the next step: ${TOUR[index + 1].name}.`}
            </p>
            <p className="tour-btns">
              <button className="btn ghost" onClick={() => jump(index + 1)}>
                Skip to the next step
              </button>
            </p>
          </>
        ) : (
          <>
            <h2 id="tour-title">{step.title}</h2>
            <p id="tour-text">{step.text}</p>
            <p className="tour-btns">
              {index > 0 && (
                <button className="btn ghost" onClick={() => jump(index - 1)}>
                  Back
                </button>
              )}
              {last ? (
                <button className="btn" onClick={onEnd}>
                  Finish the tour
                </button>
              ) : (
                <button ref={nextBtn} className="btn" onClick={next}>
                  Next: {TOUR[index + 1].name}
                </button>
              )}
            </p>
          </>
        )}
      </div>
    </>
  );
}
