"use client";

import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@moja/ui/lib/utils";
import { AlertTriangle, Gauge } from "lucide-react";

type SeatType = "PASSENGER_WINDOW" | "PASSENGER_AISLE" | "DRIVER_AREA" | "EMPTY_SPACE";

export interface BuilderSeat {
  id: string;
  label: string;
  seatType: SeatType;
}

interface SortableSeatProps {
  seat: BuilderSeat;
}

function SortableSeat({ seat }: SortableSeatProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: seat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isPassenger = seat.seatType === "PASSENGER_WINDOW" || seat.seatType === "PASSENGER_AISLE";
  const isDisabled = seat.seatType === "DRIVER_AREA";
  const isEmpty = seat.seatType === "EMPTY_SPACE";

  if (isEmpty) {
    return <div ref={setNodeRef} style={style} className="h-9 w-10 opacity-30 bg-muted/50 rounded-md border border-dashed border-border" {...attributes} {...listeners} />;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "h-9 w-10 rounded-md border text-[10px] font-semibold flex flex-col items-center justify-center gap-0.5 select-none transition-all duration-150 cursor-grab active:cursor-grabbing",
        isDisabled && "border-border bg-foreground/80 text-background",
        isPassenger && "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
      )}
    >
      {isDisabled ? <Gauge className="size-3.5" /> : <span>{seat.label}</span>}
    </div>
  );
}

interface SeatLayoutBuilderProps {
  initialSeats: BuilderSeat[];
  columns: number;
  onChange?: (seats: BuilderSeat[]) => void;
}

export function SeatLayoutBuilder({ initialSeats, columns, onChange }: SeatLayoutBuilderProps) {
  const [seats, setSeats] = useState<BuilderSeat[]>(initialSeats);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSeats((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newSeats = arrayMove(items, oldIndex, newIndex);
        onChange?.(newSeats);
        return newSeats;
      });
    }
  }

  return (
    <div className="inline-block rounded-xl border border-border bg-muted/30 p-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${columns}, 2.5rem)` }}
        >
          <SortableContext
            items={seats.map(s => s.id)}
            strategy={rectSortingStrategy}
          >
            {seats.map((seat) => (
              <SortableSeat key={seat.id} seat={seat} />
            ))}
          </SortableContext>
        </div>
      </DndContext>
      <div className="mt-3 text-center text-[10px] text-muted-foreground tracking-widest uppercase flex items-center justify-center gap-2">
        <div className="flex-1 border-t border-dashed border-border" />
        <span>Drag to reorder seats</span>
        <div className="flex-1 border-t border-dashed border-border" />
      </div>
    </div>
  );
}
