import React from "react";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "outlined" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
};

export const Card = React.forwardRef<HTMLDivElement, Props>(
  ({ 
    variant = "default", 
    padding = "md", 
    className = "", 
    children, 
    ...props 
  }, ref) => {
    const baseStyles = "rounded-lg";
    
    const variantStyles = {
      default: "bg-white border border-gray-200",
      outlined: "bg-white border-2 border-gray-300",
      elevated: "bg-white shadow-lg border border-gray-100"
    };
    
    const paddingStyles = {
      none: "",
      sm: "p-3",
      md: "p-6",
      lg: "p-8"
    };

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`flex flex-col space-y-1.5 pb-4 ${className}`}
      {...props}
    />
  )
);

CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = "", ...props }, ref) => (
    <h3
      ref={ref}
      className={`text-lg font-semibold leading-none tracking-tight ${className}`}
      {...props}
    />
  )
);

CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = "", ...props }, ref) => (
    <p
      ref={ref}
      className={`text-sm text-gray-500 ${className}`}
      {...props}
    />
  )
);

CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`pt-0 ${className}`}
      {...props}
    />
  )
);

CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`flex items-center pt-4 ${className}`}
      {...props}
    />
  )
);

CardFooter.displayName = "CardFooter";
