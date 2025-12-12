import { useEffect, useRef } from "react";

interface SeatSelectorProps {
  totalSeats: number;
  bookedSeats: number[];
  maxSelectable?: number;
  onSelectionChange: (selectedIndices: number[]) => void;
}
export function SeatSelector({
  totalSeats,
  bookedSeats,
  maxSelectable = 10,
  onSelectionChange,
}: SeatSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // We use a ref for selection to avoid re-renders on every click
  const selectedRef = useRef<Set<number>>(new Set());
  // Calculate grid dimensions
  // Try to make it somewhat square or rectangular based on total seats
  const columns = Math.min(10, Math.ceil(Math.sqrt(totalSeats * 1.5)));
  
  const getSeatBaseClasses = () => {
    return `
      relative w-10 h-10 m-1 rounded-lg border flex items-center justify-center 
      text-xs font-medium transition-all duration-200 ease-out select-none
    `.replace(/\s+/g, " ");
  };
  
  useEffect(() => {
    // Reset selection when props change
    selectedRef.current.clear();
    onSelectionChange([]);
    // Initialize grid visual state
    if (containerRef.current) {
      const seats = containerRef.current.children;
      Array.from(seats).forEach((seat, index) => {
        const el = seat as HTMLElement;
        // Reset classes
        el.className = getSeatBaseClasses();
        if (bookedSeats.includes(index)) {
          el.classList.add(
            "bg-stone-900",
            "cursor-not-allowed",
            "text-white"
          );
          el.setAttribute("aria-disabled", "true");
        } else {
          el.classList.add(
            "bg-white",
            "border-stone-200",
            "text-stone-900",
            "hover:border-sage-400",
            "hover:shadow-md",
            "cursor-pointer",
            "hover:-translate-y-0.5"
          );
          el.onclick = () => handleSeatClick(index, el);
        }
      });
    }
  }, [totalSeats, bookedSeats]);
  
  const handleSeatClick = (index: number, element: HTMLElement) => {
    const isSelected = selectedRef.current.has(index);
    if (isSelected) {
      // Deselect
      selectedRef.current.delete(index);
      element.classList.remove(
        "bg-emerald-500",
        "text-white",
        "border-emerald-500",
        "shadow-lg",
        "scale-105"
      );
      element.classList.add("bg-white", "border-stone-200", "text-stone-900");
    } else {
      // Select
      if (selectedRef.current.size >= maxSelectable) {
        // Optional: Shake animation for limit reached
        element.classList.add("animate-shake");
        setTimeout(() => element.classList.remove("animate-shake"), 500);
        return;
      }
      selectedRef.current.add(index);
      element.classList.remove(
        "bg-white",
        "border-stone-200",
        "text-stone-900"
      );
      element.classList.add(
        "bg-emerald-500",
        "text-white",
        "border-emerald-500",
        "shadow-lg",
        "scale-105"
      );
    }
    // Notify parent
    onSelectionChange(Array.from(selectedRef.current));
  };
  return (
    <div className="w-full overflow-x-auto py-8 px-4 bg-stone-50 rounded-2xl border border-stone-100">
      {/* Screen / Stage Indicator */}
      <div className="w-3/4 h-2 bg-stone-200 mx-auto mb-12 rounded-full relative">
        <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs uppercase tracking-widest text-stone-400">
          Stage / Screen
        </span>
      </div>

      {/* Grid */}
      <div
        ref={containerRef}
        className="grid gap-2 mx-auto w-fit"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({
          length: totalSeats,
        }).map((_, i) => (
          <div key={i} aria-label={`Seat ${i + 1}`} role="button" tabIndex={0}>
            {i + 1}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-12 text-sm text-stone-500">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded border border-stone-200 bg-white mr-2"></div>
          Available
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-emerald-500 mr-2"></div>
          Selected
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-stone-900 mr-2"></div>
          Booked
        </div>
      </div>
    </div>
  );
}
