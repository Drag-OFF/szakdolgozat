import "../styles/Button.css";

export default function Button({
  children,
  type = "button",
  onClick,
  style = {},
  className = "",
  variant = "neutral",
  size = "md",
  loading = false,
  disabled = false,
  ...props
}) {
  const classes = [
    "ui-btn",
    `ui-btn--${variant}`,
    `ui-btn--${size}`,
    loading ? "is-loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
}