import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const data = [
  { name: "Forex", value: 40 },
  { name: "Indices", value: 25 },
  { name: "Crypto", value: 20 },
  { name: "Others", value: 15 },
];

export default function SignalDistributionBarChart() {
  return (
    <div className="w-full h-full ">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
