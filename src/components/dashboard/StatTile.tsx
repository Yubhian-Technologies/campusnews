import {
  Card,
  CardContent,
} from "@/components/ui/card";

/** Compact stat card for staff dashboards. */
export function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between pt-6">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-1 text-3xl font-semibold">{value}</div>
        </div>
        <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
