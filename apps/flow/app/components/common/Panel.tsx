interface PanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Panel = ({ title, children, className = "" }: PanelProps) => (
  <section className={className}>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <div className="space-y-2">{children}</div>
  </section>
);

interface PanelSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const PanelSection = ({ title, children, className = "" }: PanelSectionProps) => (
  <div className={`border rounded p-2 space-y-1 ${className}`}>
    <h4 className="font-medium text-gray-700">{title}</h4>
    {children}
  </div>
);

interface ConnectionItemProps {
  sourceLabel: string;
  targetLabel: string;
  relationLabel: string;
}

export const ConnectionItem = ({
  sourceLabel,
  targetLabel,
  relationLabel,
}: ConnectionItemProps) => (
  <div className="flex items-center gap-2 text-gray-600 flex-wrap">
    <span className="bg-blue-100 px-2 py-0.5 rounded">{sourceLabel}</span>
    <span>→</span>
    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
      {relationLabel}
    </span>
    <span>→</span>
    <span className="bg-blue-100 px-2 py-0.5 rounded">{targetLabel}</span>
  </div>
);

interface EmptyMessageProps {
  message: string;
}

export const EmptyMessage = ({ message }: EmptyMessageProps) => (
  <p className="text-gray-500 text-xs">{message}</p>
);

interface ActionButtonProps {
  onClick: () => void;
  variant?: "primary" | "danger";
  size?: "sm" | "md";
  children: React.ReactNode;
  className?: string;
}

export const ActionButton = ({ 
  onClick, 
  variant = "primary", 
  size = "md",
  children,
  className = ""
}: ActionButtonProps) => {
  const baseStyles = "w-full rounded hover:shadow-lg transition-all";
  const variantStyles = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </button>
  );
};

interface InputFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  size?: "sm" | "md";
  className?: string;
}

export const InputField = ({
  value,
  onChange,
  placeholder,
  size = "md",
  className = ""
}: InputFieldProps) => {
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-3 py-2",
  };

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full border rounded ${sizeStyles[size]} ${className}`}
    />
  );
};
