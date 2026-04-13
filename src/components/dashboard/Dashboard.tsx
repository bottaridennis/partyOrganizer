import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Pizza, 
  Beer, 
  Users, 
  AlertCircle 
} from 'lucide-react';
import { Product, Participant, PantryLog } from '../../types';

interface DashboardProps {
  products: Product[];
  participants: Participant[];
  logs: PantryLog[];
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];

export function Dashboard({ products, participants, logs }: DashboardProps) {
  
  const stats = useMemo(() => {
    const totalSpending = products.reduce((acc, p) => acc + (p.price || 0) * (p.initialQuantity || 0), 0);
    const foodCount = products.filter(p => p.category === 'Cibo').length;
    const drinkCount = products.filter(p => p.category === 'Bevanda').length;
    const alcoholicCount = products.filter(p => p.labels?.includes('Alcolico')).length;
    const nonAlcoholicCount = products.filter(p => p.labels?.includes('Analcolico')).length;
    
    // Spending by category
    const spendingByCategory = products.reduce((acc: any, p) => {
      const cat = p.category || 'Altro';
      acc[cat] = (acc[cat] || 0) + (p.price || 0) * (p.initialQuantity || 0);
      return acc;
    }, {});

    const pieData = Object.keys(spendingByCategory).map(name => ({
      name,
      value: spendingByCategory[name]
    }));

    // Spending by participant
    const spendingByParticipant = products.reduce((acc: any, p) => {
      const owner = p.broughtBy || 'Comune';
      acc[owner] = (acc[owner] || 0) + (p.price || 0) * (p.initialQuantity || 0);
      return acc;
    }, {});

    const barData = Object.keys(spendingByParticipant).map(name => {
      const participant = participants.find(p => p.uid === name);
      return {
        name: participant ? `${participant.name}` : name,
        spesa: spendingByParticipant[name]
      };
    });

    return {
      totalSpending,
      foodCount,
      drinkCount,
      alcoholicCount,
      nonAlcoholicCount,
      pieData,
      barData
    };
  }, [products, participants]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={DollarSign} 
          label="Spesa Totale" 
          value={`€${stats.totalSpending.toFixed(2)}`} 
          color="bg-emerald-500"
        />
        <StatCard 
          icon={Pizza} 
          label="Prodotti Cibo" 
          value={stats.foodCount} 
          color="bg-orange-500"
        />
        <StatCard 
          icon={Beer} 
          label="Prodotti Bevande" 
          value={stats.drinkCount} 
          color="bg-blue-500"
        />
        <StatCard 
          icon={Users} 
          label="Partecipanti" 
          value={participants.length} 
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spending by Category */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Spesa per Categoria
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={stats.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => `€${value.toFixed(2)}`}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contribution by Participant */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Contributo per Amico
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={stats.barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => `€${value.toFixed(2)}`}
                />
                <Bar dataKey="spesa" fill="#8884d8" radius={[8, 8, 0, 0]}>
                  {stats.barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alcohol Stats */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          Mix Alcolico vs Analcolico
        </h3>
        <div className="flex items-center gap-4 h-12 bg-slate-100 rounded-full overflow-hidden p-1">
          <div 
            className="h-full bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-1000"
            style={{ width: `${(stats.alcoholicCount / (stats.alcoholicCount + stats.nonAlcoholicCount || 1)) * 100}%` }}
          >
            {stats.alcoholicCount > 0 && `Alcolici (${stats.alcoholicCount})`}
          </div>
          <div 
            className="h-full bg-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-1000"
            style={{ width: `${(stats.nonAlcoholicCount / (stats.alcoholicCount + stats.nonAlcoholicCount || 1)) * 100}%` }}
          >
            {stats.nonAlcoholicCount > 0 && `Analcolici (${stats.nonAlcoholicCount})`}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
      <div className={`${color} w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}
