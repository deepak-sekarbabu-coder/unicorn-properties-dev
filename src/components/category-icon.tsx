import { cn } from "@/lib/utils";
import { Icons, IconName } from "@/components/icons";

interface CategoryIconProps extends React.HTMLAttributes<HTMLDivElement> {
  name: IconName;
}

export function CategoryIcon({ name, className, ...props }: CategoryIconProps) {
  const IconComponent = Icons[name];

  if (!IconComponent) {
    return null;
  }

  return (
    <div className={cn("flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground", className)} {...props}>
      <IconComponent className="h-4 w-4" />
    </div>
  );
}
