"use client";
import { forwardRef } from "react";

interface NativeSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ options, placeholder, ...props }, ref) => {
    const isDark =
      typeof document !== "undefined"
        ? document.documentElement.classList.contains("dark")
        : true;

    const bgColor = isDark ? "#1E1E21" : "#FFFFFF";
    const textColor = isDark ? "#F0EFF2" : "#1A1A1C";
    const borderColor = isDark
      ? "rgba(255,255,255,0.10)"
      : "rgba(0,0,0,0.10)";

    return (
      <div style={{ position: "relative", width: "100%" }}>
        <select
          ref={ref}
          {...props}
          style={{
            width: "100%",
            backgroundColor: bgColor,
            color: textColor,
            border: `0.5px solid ${borderColor}`,
            borderRadius: 7,
            padding: "8px 36px 8px 12px",
            fontSize: 13,
            fontFamily: "inherit",
            cursor: "pointer",
            outline: "none",
            appearance: "none",
            WebkitAppearance: "none",
            colorScheme: "dark",
            transition: "border-color 0.12s ease",
            ...((props.style as object) ?? {}),
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#D4004E";
            e.currentTarget.style.boxShadow = "0 0 0 2px rgb(212 0 78 / 0.18)";
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = borderColor;
            e.currentTarget.style.boxShadow = "none";
            props.onBlur?.(e);
          }}
        >
          {placeholder && (
            <option value="" disabled style={{ backgroundColor: bgColor, color: textColor }}>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option
              key={o.value}
              value={o.value}
              style={{ backgroundColor: bgColor, color: textColor }}
            >
              {o.label}
            </option>
          ))}
        </select>
        <div
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 4L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    );
  }
);
NativeSelect.displayName = "NativeSelect";
