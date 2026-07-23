import {
  getPaymentMethodMeta,
  type PaymentMethodId,
} from "@/lib/payment-methods";

type PaymentMethodIconProps = {
  method: PaymentMethodId | string;
  size?: "sm" | "md";
  className?: string;
};

/**
 * App-owned monogram badge (not official bank logos).
 */
export function PaymentMethodIcon({
  method,
  size = "sm",
  className = "",
}: PaymentMethodIconProps) {
  const meta = getPaymentMethodMeta(method);
  const sizeClass =
    size === "md"
      ? "h-7 min-w-7 px-1.5 text-[10px]"
      : "h-6 min-w-6 px-1 text-[9px]";

  return (
    <span
      title={meta.label}
      aria-label={meta.label}
      className={[
        "inline-flex shrink-0 items-center justify-center rounded-md font-bold leading-none text-white shadow-sm",
        sizeClass,
        className,
      ].join(" ")}
      style={{ backgroundColor: meta.color }}
    >
      {meta.monogram}
    </span>
  );
}
