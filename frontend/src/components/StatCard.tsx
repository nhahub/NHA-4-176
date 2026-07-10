type Props = {
  label: string;
  value: string;
  detail: string;
};

export function StatCard({ label, value, detail }: Props) {
  return (
    <div className="panel kpi">
      <div className="muted" style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 12 }}>
        {label}
      </div>
      <div className="kpi-value">{value}</div>
      <div className="muted">{detail}</div>
    </div>
  );
}

