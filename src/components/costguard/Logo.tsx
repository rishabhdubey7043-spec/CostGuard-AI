import { useId } from "react";

import { cn } from "@/lib/utils";

/**
 * CostGuard AI brand logo: a minimal shield housing an API node graph,
 * stroked with the brand's emerald → cyan gradient.
 */
export function Logo({ className }: { className?: string }) {
  const gradId = useId();

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn("h-6 w-6 shrink-0", className)}
    >
      <defs>
        <linearGradient id={gradId} x1="5" y1="4" x2="27" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>

      {/* Shield */}
      <path
        d="M16 3.2 26.2 6.9v7.5c0 6.6-4.4 11.3-10.2 13.9C10.2 25.7 5.8 21 5.8 14.4V6.9L16 3.2Z"
        stroke={`url(#${gradId})`}
        strokeWidth="2.1"
        strokeLinejoin="round"
      />

      {/* Central API node */}
      <circle cx="16" cy="15.2" r="2.6" fill={`url(#${gradId})`} />

      {/* Linked nodes — right */}
      <path
        d="M18.2 13.6 21.4 11.4M21.4 11.4h.01"
        stroke={`url(#${gradId})`}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="22.2" cy="10.9" r="1.4" fill={`url(#${gradId})`} />

      {/* Linked nodes — left */}
      <path
        d="M13.8 16.8 10.9 19.2"
        stroke={`url(#${gradId})`}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="9.8" cy="20" r="1.4" fill={`url(#${gradId})`} />
    </svg>
  );
}
