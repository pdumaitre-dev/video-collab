export interface SelectedRange {
  startSeconds: number;
  endSeconds: number;
}

export interface DragSelection {
  dragStartSeconds: number;
  dragEndSeconds: number;
}

export interface RangeStyle {
  left: string;
  width: string;
}

export function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const seconds = Math.floor(totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  const padded = remaining.toString().padStart(2, "0");
  return `${minutes}:${padded}`;
}

export function getDisplayRange({
  durationSeconds,
  selection,
  selectedRange
}: {
  durationSeconds: number;
  selection: DragSelection | null;
  selectedRange: SelectedRange | null;
}): SelectedRange | null {
  if (durationSeconds <= 0) return null;

  if (selection) {
    return {
      startSeconds: Math.max(
        0,
        Math.min(selection.dragStartSeconds, selection.dragEndSeconds)
      ),
      endSeconds: Math.min(
        durationSeconds,
        Math.max(selection.dragStartSeconds, selection.dragEndSeconds)
      )
    };
  }

  if (selectedRange) {
    return {
      startSeconds: Math.max(0, selectedRange.startSeconds),
      endSeconds: Math.min(durationSeconds, selectedRange.endSeconds)
    };
  }

  return null;
}

export function getSelectionStyle(
  displayRange: SelectedRange | null,
  durationSeconds: number
): RangeStyle | null {
  if (!displayRange || durationSeconds <= 0) return null;

  return {
    left: `${(displayRange.startSeconds / durationSeconds) * 100}%`,
    width: `${((displayRange.endSeconds - displayRange.startSeconds) / durationSeconds) * 100}%`
  };
}
