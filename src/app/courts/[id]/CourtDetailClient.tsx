"use client";
// app/courts/[id]/CourtDetailClient.tsx

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type Court = {
  id: string;
  name: string;
  image_url: string | null;
  price_per_hour: number | null;
  location: string | null;
  description?: string | null;
  surface?: string | null;
  indoor?: boolean | null;
  amenities?: string[] | null;
  max_players?: number | null;
  tags?: string[] | null;
  dimensions?: string | null;
};

type Slot = {
  id: string;
  time: string;
  duration_minutes: number;
  is_booked: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function toAmPm(time: string) {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour   = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}
function endTime(time: string, duration: number) {
  const [h, m] = time.split(":").map(Number);
  const total  = h * 60 + m + duration;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
function getValidSlots(slots: Slot[], duration: number) {
  const blocksNeeded = duration / 30;
  return slots.filter((slot, index) => {
    if (slot.is_booked) return false;
    for (let i = 1; i < blocksNeeded; i++) {
      const next = slots[index + i];
      if (!next || next.is_booked) return false;
      const [h1, m1] = slot.time.split(":").map(Number);
      const [h2, m2] = next.time.split(":").map(Number);
      if ((h2 * 60 + m2) - (h1 * 60 + m1) !== 30 * i) return false;
    }
    return true;
  });
}

// ─── Placeholder panels ───────────────────────────────────────────────────────

const PLACEHOLDER_PANELS = [
  { id: "p1", label: "Evening Lights", color: "#0d1f35", accent: "#1e5fa3", icon: "💡" },
  { id: "p2", label: "Gallery Stand",  color: "#2a1a1a", accent: "#7a3a2d", icon: "🏟️" },
  { id: "p3", label: "Surface Detail", color: "#1a2a3a", accent: "#2d5a7a", icon: "📐" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function CourtDetailClient({ court }: { court: Court }) {
  const supabase = createClient();
  const today    = new Date();

  const [activePhoto,   setActivePhoto]   = useState(0);
  const [selectedDate,  setSelectedDate]  = useState(today);
  const [slots,         setSlots]         = useState<Slot[]>([]);
  const [selectedSlot,  setSelectedSlot]  = useState<Slot | null>(null);
  const [weekOffset,    setWeekOffset]    = useState(0);
  const [confirmOpen,   setConfirmOpen]   = useState(false);
  const [booked,        setBooked]        = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [bookingError,  setBookingError]  = useState<string | null>(null);
  const [duration,      setDuration]      = useState(60);

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(today, weekOffset * 7 + i));

  const photos = [
    court.image_url
      ? { id: "real", label: "Court View", src: court.image_url, color: "#1a3a2a", accent: "#2d7a52", icon: "🎾" }
      : { id: "p0",   label: "Court View", src: null,            color: "#1a3a2a", accent: "#2d7a52", icon: "🎾" },
    ...PLACEHOLDER_PANELS.map(p => ({ ...p, src: null })),
  ];

  const tags = court.tags?.length ? court.tags : ["Outdoor", "Competition Grade"];

  // Fetch slots when date changes
  useEffect(() => {
    async function fetchSlots() {
      setLoading(true);
      setSelectedSlot(null);
      setBookingError(null);
      const { data } = await supabase
        .from("court_slots")
        .select("id, time, duration_minutes, is_booked")
        .eq("court_id", court.id)
        .eq("date", formatDate(selectedDate))
        .order("time");
      setSlots(data || []);
      setLoading(false);
    }
    fetchSlots();
  }, [selectedDate, court.id]);

  // Clear selection when duration changes
  useEffect(() => {
    setSelectedSlot(null);
  }, [duration]);

  // Book slot
  async function handleBook() {
    if (!selectedSlot) return;
    setBookingError(null);

    const blocksNeeded = duration / 30;
    const slotIndex    = slots.findIndex(s => s.id === selectedSlot.id);
    const slotIds      = slots.slice(slotIndex, slotIndex + blocksNeeded).map(s => s.id);

    const { error } = await supabase
      .from("court_slots")
      .update({ is_booked: true })
      .in("id", slotIds);

    if (error) { setBookingError("Failed to reserve. Please try again."); return; }

    await supabase.from("bookings").insert({
      court_id:    court.id,
      slot_id:     selectedSlot.id,
      total_price: (court.price_per_hour ?? 0) * duration / 60,
    });

    setSlots(prev => prev.map(s => slotIds.includes(s.id) ? { ...s, is_booked: true } : s));
    setConfirmOpen(false);
    setBooked(true);
    setTimeout(() => setBooked(false), 3000);
  }

  const validSlots   = getValidSlots(slots, duration);
  const currentPhoto = photos[activePhoto];
  const totalPrice   = ((court.price_per_hour ?? 0) * duration / 60).toFixed(2);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f2ed",
      fontFamily: "'Georgia','Times New Roman',serif", color: "#1c1c1c" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .pfont { font-family: 'Playfair Display', Georgia, serif; }
        .sfont { font-family: 'DM Sans', sans-serif; }
        .btn-primary {
          background: #1c1c1c; color: #f5f2ed; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-weight: 500; letter-spacing: 0.08em;
          text-transform: uppercase; font-size: 13px; padding: 14px 32px; transition: all 0.2s;
        }
        .btn-primary:hover:not(:disabled) { background: #2d7a52; }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-outline {
          background: transparent; color: #1c1c1c; border: 1.5px solid #1c1c1c; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-weight: 500; letter-spacing: 0.08em;
          text-transform: uppercase; font-size: 12px; padding: 10px 22px; transition: all 0.2s;
        }
        .btn-outline:hover { background: #1c1c1c; color: #f5f2ed; }
        .slot-btn {
          border: 1.5px solid #1c1c1c; background: transparent; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          padding: 10px 14px; transition: all 0.18s; color: #1c1c1c; letter-spacing: 0.04em; width: 100%;
        }
        .slot-btn:hover:not(:disabled) { background: #1c1c1c; color: #f5f2ed; }
        .slot-btn.selected { background: #2d7a52; border-color: #2d7a52; color: #fff; }
        .slot-btn.taken { background: #e8e5e0; border-color: #d0cdc8; color: #aaa9a6; cursor: not-allowed; text-decoration: line-through; }
        .dur-btn {
          flex: 1; padding: 10px 8px; border: 1.5px solid #1c1c1c; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          transition: all 0.18s; background: transparent; color: #1c1c1c;
        }
        .dur-btn.active { background: #1c1c1c; color: #f5f2ed; }
        .dur-btn:hover:not(.active) { background: #f0f0f0; }
        .day-btn {
          display: flex; flex-direction: column; align-items: center; padding: 10px 14px;
          cursor: pointer; border: 1.5px solid transparent; transition: all 0.18s;
          min-width: 56px; background: transparent; font-family: 'DM Sans', sans-serif;
        }
        .day-btn:hover { border-color: #1c1c1c; }
        .day-btn.active { background: #1c1c1c; color: #f5f2ed; border-color: #1c1c1c; }
        .day-btn.today-btn { border-color: #2d7a52; }
        .tag {
          display: inline-block; border: 1px solid #1c1c1c; font-family: 'DM Sans', sans-serif;
          font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 10px;
        }
        .amenity-pill {
          background: #fff; border: 1px solid #ddd; font-family: 'DM Sans', sans-serif;
          font-size: 12px; padding: 6px 14px; display: inline-flex; align-items: center; gap: 6px;
        }
        .photo-thumb { cursor: pointer; transition: all 0.2s; border: 2px solid transparent; overflow: hidden; }
        .photo-thumb.active { border-color: #2d7a52; }
        .toast {
          position: fixed; bottom: 32px; right: 32px; background: #2d7a52; color: #fff;
          font-family: 'DM Sans', sans-serif; font-size: 14px; padding: 16px 28px;
          font-weight: 500; letter-spacing: 0.04em; box-shadow: 0 8px 32px rgba(0,0,0,0.2); z-index: 9999;
        }
        .modal-backdrop {
          position: fixed; inset: 0; background: rgba(28,28,28,0.6);
          display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(3px);
        }
        .modal { background: #f5f2ed; padding: 48px; max-width: 420px; width: 90%; }
        .divider { height: 1px; background: #d8d5d0; margin: 28px 0; }
        .stat-box { border: 1px solid #d8d5d0; padding: 20px 24px; background: #fff; text-align: center; }
        @media (max-width: 900px) { .main-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* ── NAV ── */}
      <header style={{ borderBottom: "1px solid #d8d5d0", background: "#f5f2ed",
        padding: "0 40px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 64, position: "sticky", top: 0, zIndex: 100 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
          <span style={{ fontSize: 22 }}>🎾</span>
          <span className="pfont" style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>CourtBook</span>
        </Link>
        <nav className="sfont" style={{ display: "flex", gap: 32, fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          <Link href="/courts" style={{ color: "#1c1c1c", textDecoration: "none", opacity: 0.5 }}>Courts</Link>
          <Link href="/courts" style={{ color: "#1c1c1c", textDecoration: "none", fontWeight: 500 }}>Book Now</Link>
        </nav>
      </header>

      {/* ── BREADCRUMB ── */}
      <div className="sfont" style={{ padding: "16px 40px", fontSize: 12, color: "#888",
        letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid #e8e5e0" }}>
        <Link href="/courts" style={{ color: "#888", textDecoration: "none" }}>Courts</Link>
        {" / "}
        <span style={{ color: "#1c1c1c" }}>{court.name}</span>
      </div>

      {/* ── MAIN ── */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 40px" }}>
        <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 48 }}>

          {/* ── LEFT ── */}
          <div>
            {/* Hero photo */}
            <div style={{ background: currentPhoto.color, height: 420, position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, opacity: 0.08, pointerEvents: "none",
                backgroundImage: "repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 60px),repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 60px)" }} />
              {currentPhoto.src ? (
                <img src={currentPhoto.src} alt={court.name}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <>
                  <div style={{ position: "absolute", border: `2px solid ${currentPhoto.accent}44`, inset: 28, pointerEvents: "none" }} />
                  <div style={{ textAlign: "center", zIndex: 1 }}>
                    <div style={{ fontSize: 72, marginBottom: 12 }}>{currentPhoto.icon}</div>
                    <div className="sfont" style={{ color: currentPhoto.accent, fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase" }}>{currentPhoto.label}</div>
                  </div>
                </>
              )}
              <div style={{ position: "absolute", top: 20, left: 20, background: "#2d7a52", color: "#fff",
                fontFamily: "'DM Sans',sans-serif", fontSize: 11, padding: "5px 12px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {court.indoor ? "Indoor" : "Outdoor"}
              </div>
            </div>

            {/* Thumbnails */}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {photos.map((p, i) => (
                <div key={p.id} className={`photo-thumb${activePhoto === i ? " active" : ""}`}
                  onClick={() => setActivePhoto(i)}
                  style={{ width: 80, height: 58, flexShrink: 0, background: p.color,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                  {p.src
                    ? <img src={p.src} alt={p.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : p.icon}
                </div>
              ))}
            </div>

            {/* About */}
            <div style={{ marginTop: 40 }}>
              <h2 className="pfont" style={{ fontSize: 24, marginBottom: 20 }}>About This Court</h2>
              <p className="sfont" style={{ lineHeight: 1.75, color: "#444", fontSize: 15 }}>
                {court.description || "A premium court available for booking."}
              </p>
              <div className="divider" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 32 }}>
                {[
                  { label: "Surface",     value: court.surface    || "Hard Court" },
                  { label: "Dimensions",  value: court.dimensions || "Standard"   },
                  { label: "Max Players", value: `${court.max_players ?? 4} players` },
                ].map(s => (
                  <div key={s.label} className="stat-box">
                    <div className="sfont" style={{ fontSize: 11, color: "#888", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
                    <div className="pfont" style={{ fontSize: 17, fontWeight: 700 }}>{s.value}</div>
                  </div>
                ))}
              </div>
              {court.amenities?.length ? (
                <>
                  <h3 className="pfont" style={{ fontSize: 18, marginBottom: 14 }}>Amenities</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {court.amenities.map(a => (
                      <span key={a} className="amenity-pill"><span style={{ opacity: 0.5 }}>✦</span> {a}</span>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* ── RIGHT: Booking Panel ── */}
          <div>
            <div style={{ marginBottom: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {tags.map(t => <span key={t} className="tag sfont">{t}</span>)}
            </div>
            <h1 className="pfont" style={{ fontSize: 40, lineHeight: 1.1, marginBottom: 6 }}>{court.name}</h1>
            <p className="sfont" style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>{court.location}</p>

            {/* Price */}
            <div style={{ background: "#1c1c1c", color: "#f5f2ed", padding: "20px 24px",
              marginBottom: 32, display: "flex", alignItems: "baseline", gap: 8 }}>
              <span className="pfont" style={{ fontSize: 36, fontWeight: 900 }}>${court.price_per_hour ?? "—"}</span>
              <span className="sfont" style={{ fontSize: 14, opacity: 0.6, letterSpacing: "0.06em" }}>/ HOUR</span>
            </div>

            {/* Duration selector */}
            <div style={{ marginBottom: 28 }}>
              <h3 className="pfont" style={{ fontSize: 18, marginBottom: 14 }}>Duration</h3>
              <div style={{ display: "flex", gap: 8 }}>
                {[60, 90, 120].map(d => (
                  <button key={d} className={`dur-btn${duration === d ? " active" : ""}`}
                    onClick={() => setDuration(d)}>
                    {d} Min
                  </button>
                ))}
              </div>
            </div>

            {/* Date selector */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h3 className="pfont" style={{ fontSize: 18 }}>Select Date</h3>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => setWeekOffset(w => Math.max(0, w - 1))}
                    style={{ background: "none", border: "1px solid #ccc", width: 30, height: 30,
                      cursor: weekOffset === 0 ? "not-allowed" : "pointer", fontSize: 16, opacity: weekOffset === 0 ? 0.3 : 1 }}>‹</button>
                  <button onClick={() => setWeekOffset(w => w + 1)}
                    style={{ background: "none", border: "1px solid #ccc", width: 30, height: 30, cursor: "pointer", fontSize: 16 }}>›</button>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                {weekDates.map(d => {
                  const isSelected  = formatDate(d) === formatDate(selectedDate);
                  const isTodayDate = formatDate(d) === formatDate(today);
                  return (
                    <button key={d.toISOString()}
                      className={`day-btn${isSelected ? " active" : ""}${isTodayDate && !isSelected ? " today-btn" : ""}`}
                      onClick={() => setSelectedDate(d)}>
                      <span className="sfont" style={{ fontSize: 10, letterSpacing: "0.08em", opacity: isSelected ? 1 : 0.5 }}>{DAYS[d.getDay()]}</span>
                      <span className="pfont" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>{d.getDate()}</span>
                      {isTodayDate && (
                        <span className="sfont" style={{ fontSize: 8, color: isSelected ? "#a8e0c0" : "#2d7a52", letterSpacing: "0.1em" }}>TODAY</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="sfont" style={{ fontSize: 12, color: "#888", marginTop: 10, letterSpacing: "0.04em" }}>
                {MONTHS[selectedDate.getMonth()]} {selectedDate.getDate()}, {selectedDate.getFullYear()}
                {" · "}
                <span style={{ color: loading ? "#888" : validSlots.length > 3 ? "#2d7a52" : "#c0392b", fontWeight: 500 }}>
                  {loading ? "Loading…" : `${validSlots.length} slots available`}
                </span>
              </div>
            </div>

            {/* Time slots */}
            <div style={{ marginBottom: 28 }}>
              <h3 className="pfont" style={{ fontSize: 18, marginBottom: 14 }}>Available Times</h3>
              {loading ? (
                <p className="sfont" style={{ fontSize: 14, color: "#888" }}>Loading slots…</p>
              ) : validSlots.length === 0 ? (
                <p className="sfont" style={{ fontSize: 14, color: "#888" }}>No slots available for this date.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
                  {validSlots.map(s => (
                    <button key={s.id}
                      className={`slot-btn${selectedSlot?.id === s.id ? " selected" : ""}`}
                      onClick={() => setSelectedSlot(selectedSlot?.id === s.id ? null : s)}>
                      {toAmPm(s.time)}
                    </button>
                  ))}
                </div>
              )}
              <div className="sfont" style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 11, color: "#888" }}>
                {[
                  { bg: "transparent", border: "1.5px solid #1c1c1c", label: "Available" },
                  { bg: "#2d7a52",     border: "none",                 label: "Selected"  },
                ].map(l => (
                  <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 12, height: 12, background: l.bg, border: l.border, display: "inline-block" }} />
                    {l.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Selected summary */}
            {selectedSlot && (
              <div style={{ border: "1px solid #2d7a52", padding: "14px 18px", marginBottom: 16, background: "#f0faf4" }}>
                <div className="sfont" style={{ fontSize: 12, color: "#2d7a52", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Selected</div>
                <div className="pfont" style={{ fontSize: 20 }}>
                  {toAmPm(selectedSlot.time)} — {toAmPm(endTime(selectedSlot.time, duration))}
                </div>
                <div className="sfont" style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
                  {MONTHS[selectedDate.getMonth()]} {selectedDate.getDate()} · ${totalPrice}
                </div>
              </div>
            )}

            <button className="btn-primary" disabled={!selectedSlot}
              onClick={() => selectedSlot && setConfirmOpen(true)}
              style={{ width: "100%", padding: "16px" }}>
              {selectedSlot ? "Reserve Court" : "Select a Time Slot"}
            </button>
            <p className="sfont" style={{ fontSize: 11, color: "#888", textAlign: "center", marginTop: 10 }}>
              Free cancellation up to 24 hours before
            </p>
          </div>
        </div>
      </main>

      {/* ── CONFIRM MODAL ── */}
      {confirmOpen && selectedSlot && (
        <div className="modal-backdrop" onClick={() => setConfirmOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="pfont" style={{ fontSize: 28, marginBottom: 6 }}>Confirm Booking</div>
            <p className="sfont" style={{ fontSize: 14, color: "#666", marginBottom: 28 }}>Review your reservation details below.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Court",    value: court.name },
                { label: "Location", value: court.location || "—" },
                { label: "Date",     value: `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}` },
                { label: "Time",     value: `${toAmPm(selectedSlot.time)} — ${toAmPm(endTime(selectedSlot.time, duration))}` },
                { label: "Duration", value: `${duration} min` },
                { label: "Total",    value: `$${totalPrice}` },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span className="sfont" style={{ fontSize: 12, color: "#888", letterSpacing: "0.08em", textTransform: "uppercase" }}>{r.label}</span>
                  <span className="pfont" style={{ fontSize: 16 }}>{r.value}</span>
                </div>
              ))}
            </div>
            <div className="divider" />
            {bookingError && <p className="sfont" style={{ fontSize: 13, color: "#c0392b", marginBottom: 16 }}>{bookingError}</p>}
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 2 }} onClick={handleBook}>Confirm &amp; Pay</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {booked && (
        <div className="toast">✓ Court reserved for {toAmPm(selectedSlot?.time ?? "")}!</div>
      )}
    </div>
  );
}
