import React, { useState, useEffect, useMemo } from 'react';

import {
    TrendingUp,
    ShoppingBag,
    DollarSign,
    Users,
    LayoutDashboard,
    LogOut,
    ChevronDown,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    Calendar,
    Layers,
    Percent,
    Sparkles,
    Zap,
    AlertCircle,
    Lightbulb,
    Key,
    Database,
    RefreshCw,
    Cpu
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend
} from 'recharts';
import { parseISO, isWithinInterval, format } from 'date-fns';
import { GoogleGenAI } from "@google/genai";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
            <div className={cn("p-2 rounded-xl", color)}>
                <Icon className="w-5 h-5" />
            </div>
            {trend && (
                <span className={cn(
                    "flex items-center text-xs font-medium px-2 py-1 rounded-full",
                    trend === 'up' ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                )}>
                    {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {trendValue}
                </span>
            )}
        </div>
        <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
);

const InsightCard = ({ label, value, description, icon: Icon, color }) => (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start gap-4">
        <div className={cn("p-2.5 rounded-lg shrink-0", color)}>
            <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</div>
            <div className="text-sm font-bold text-slate-900 truncate">{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{description}</div>
        </div>
    </div>
);

const App = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters State
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('All');
    const [selectedChannel, setSelectedChannel] = useState('All');

    // AI State
    const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '');
    const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
    const [aiInsights, setAiInsights] = useState(null);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        localStorage.setItem('gemini_api_key', apiKey);
    }, [apiKey]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/sales');
                if (!response.ok) throw new Error(`API error: ${response.status}`);
                const cleanData = await response.json();

                setData(cleanData);
                if (cleanData.length > 0) {
                    const dates = cleanData.map(d => d.date).sort();
                    setStartDate(dates[0]);
                    setEndDate(dates[dates.length - 1]);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error loading data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);


    const productOptions = useMemo(() => ['All', ...new Set(data.map(d => d.product))], [data]);
    const channelOptions = useMemo(() => ['All', ...new Set(data.map(d => d.channel))], [data]);

    const filteredData = useMemo(() => {
        return data.filter(row => {
            const dateMatch = (!startDate || !endDate) || isWithinInterval(parseISO(row.date), {
                start: parseISO(startDate),
                end: parseISO(endDate)
            });
            const productMatch = selectedProduct === 'All' || row.product === selectedProduct;
            const channelMatch = selectedChannel === 'All' || row.channel === selectedChannel;
            return dateMatch && productMatch && channelMatch;
        });
    }, [data, startDate, endDate, selectedProduct, selectedChannel]);

    const summaryMetrics = useMemo(() => {
        const totalRev = filteredData.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
        const totalOrders = filteredData.reduce((acc, curr) => acc + (curr.orders || 0), 0);
        const totalCost = filteredData.reduce((acc, curr) => acc + (curr.cost || 0), 0);
        const totalProfit = totalRev - totalCost;
        const aov = totalOrders > 0 ? totalRev / totalOrders : 0;

        return { totalRev, totalOrders, totalProfit, aov };
    }, [filteredData]);

    const stats = useMemo(() => {
        const { totalRev, totalOrders, totalProfit, aov } = summaryMetrics;
        return {
            totalRevenue: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalRev),
            totalOrders: totalOrders.toLocaleString(),
            totalProfit: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalProfit),
            aov: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(aov),
        };
    }, [summaryMetrics]);

    // Data Insights
    const dataInsights = useMemo(() => {
        if (filteredData.length === 0) return null;

        // Best Product
        const productRev = filteredData.reduce((acc, curr) => {
            acc[curr.product] = (acc[curr.product] || 0) + (curr.revenue || 0);
            return acc;
        }, {});
        const bestProduct = Object.entries(productRev).sort((a, b) => b[1] - a[1])[0]?.[0];

        // Best Channel (by orders)
        const channelOrders = filteredData.reduce((acc, curr) => {
            acc[curr.channel] = (acc[curr.channel] || 0) + (curr.orders || 0);
            return acc;
        }, {});
        const bestChannel = Object.entries(channelOrders).sort((a, b) => b[1] - a[1])[0]?.[0];

        // Highest Revenue Day
        const dailyRev = filteredData.reduce((acc, curr) => {
            acc[curr.date] = (acc[curr.date] || 0) + (curr.revenue || 0);
            return acc;
        }, {});
        const peakDayEntry = Object.entries(dailyRev).sort((a, b) => b[1] - a[1])[0];
        const peakDay = peakDayEntry ? format(parseISO(peakDayEntry[0]), 'MMM dd, yyyy') : 'N/A';

        // Best Conversion Channel
        const channelConv = filteredData.reduce((acc, curr) => {
            if (!acc[curr.channel]) acc[curr.channel] = { cust: 0, visit: 0 };
            acc[curr.channel].cust += (curr.customers || 0);
            acc[curr.channel].visit += (curr.visitors || 0);
            return acc;
        }, {});
        const bestConv = Object.entries(channelConv)
            .map(([name, vals]) => [name, vals.visit > 0 ? vals.cust / vals.visit : 0])
            .sort((a, b) => b[1] - a[1])[0]?.[0];

        return { bestProduct, bestChannel, peakDay, bestConv };
    }, [filteredData]);

    const chartData = useMemo(() => {
        // 1. Revenue trend by date
        const dateGroups = filteredData.reduce((acc, curr) => {
            acc[curr.date] = (acc[curr.date] || 0) + (curr.revenue || 0);
            return acc;
        }, {});
        const revenueTrend = Object.keys(dateGroups).sort().map(date => ({
            date: format(parseISO(date), 'MMM dd'),
            revenue: dateGroups[date]
        }));

        // 2. Revenue by channel
        const channelGroups = filteredData.reduce((acc, curr) => {
            acc[curr.channel] = (acc[curr.channel] || 0) + (curr.revenue || 0);
            return acc;
        }, {});
        const revenueByChannel = Object.keys(channelGroups).map(channel => ({
            name: channel,
            value: channelGroups[channel]
        }));

        // 3. Top products by revenue
        const productGroups = filteredData.reduce((acc, curr) => {
            acc[curr.product] = (acc[curr.product] || 0) + (curr.revenue || 0);
            return acc;
        }, {});
        const topProducts = Object.keys(productGroups)
            .map(product => ({ name: product, revenue: productGroups[product] }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        return { revenueTrend, revenueByChannel, topProducts };
    }, [filteredData]);

    const generateAIInsights = async () => {
        if (!apiKey) {
            alert('Please enter your Gemini API Key in the settings.');
            return;
        }
        setGenerating(true);
        try {
            const client = new GoogleGenAI({ apiKey: apiKey.trim() });

            const prompt = `
        Analyze this sales data summary for a business:
        - Total Revenue: ${stats.totalRevenue}
        - Total Orders: ${stats.totalOrders}
        - Total Profit: ${stats.totalProfit}
        - Avg. Order Value: ${stats.aov}
        - Top Product: ${dataInsights.bestProduct}
        - Best Channel: ${dataInsights.bestChannel}
        - Channel with Highest Conversion: ${dataInsights.bestConv}
        - Filters: Product=${selectedProduct}, Channel=${selectedChannel}

        Please provide exactly 3 bullet points under each of these categories:
        1. Alerts (Critical issues or risks)
        2. Opportunities (Growth potential)
        3. Suggestions (Actionable steps)

        Keep each bullet point short, simple, and in clear business language.
        Format as JSON like this: {"alerts": ["...", "..."], "opportunities": ["...", "..."], "suggestions": ["...", "..."]}
      `;

            const result = await client.models.generateContent({
                model: selectedModel,
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            });

            const outputText = result.text || (result.response && result.response.text());

            console.log("AI Response:", outputText);

            // Basic JSON extraction in case model adds markdown
            const jsonStart = outputText.indexOf('{');
            const jsonEnd = outputText.lastIndexOf('}') + 1;

            if (jsonStart === -1 || jsonEnd === 0) {
                throw new Error("Invalid response format from AI. Please try again.");
            }

            const jsonStr = outputText.substring(jsonStart, jsonEnd);
            setAiInsights(JSON.parse(jsonStr));
        } catch (error) {
            console.error('Gemini AI Detailed Error:', error);
            const errorMessage = error.message || 'Unknown error';
            alert(`Failed to generate insights: ${errorMessage}\n\nPlease check your API key, model selection, and internet connection.`);
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen">
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <TrendingUp className="text-white w-5 h-5" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">SalesDash</span>
                    </div>

                    <nav className="space-y-1">
                        <a href="#" className="flex items-center gap-3 px-3 py-2 bg-slate-50 text-primary rounded-lg font-medium">
                            <LayoutDashboard className="w-5 h-5" />
                            Overview
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                            <ShoppingBag className="w-5 h-5" />
                            Sales Analysis
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                            <Cpu className="w-5 h-5" />
                            AI Advisor
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                            <Users className="w-5 h-5" />
                            Customers
                        </a>
                    </nav>
                </div>

                <div className="mt-auto p-6 space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 mb-2 text-primary">
                            <Key className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Settings</span>
                        </div>
                        <div className="space-y-2">
                            <div className="relative">
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Gemini API Key"
                                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-primary focus:outline-none pr-8"
                                />
                                <Database className="w-3 h-3 text-slate-300 absolute right-2.5 top-2.5" />
                            </div>
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none"
                            >
                                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fastest)</option>
                                <option value="gemini-3.0-flash">Gemini 3.0 Flash (Preview)</option>
                                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Advanced)</option>
                            </select>
                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-primary hover:underline block text-center"
                            >
                                Get API Key here ↗
                            </a>
                        </div>
                    </div>
                    <button className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:text-rose-600 transition-colors w-full">
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-bold text-slate-800">Intelligence Hub</h1>
                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">LIVE</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center font-bold text-[10px] text-white">JD</div>
                            <span className="text-sm font-medium text-slate-700">John Doe</span>
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto space-y-8">
                    {/* Header & Filters */}
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 leading-tight">Dashboard Overview</h2>
                            <p className="text-slate-500 mt-1">Real-time business insights and performance tracking.</p>
                        </div>

                        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 border-r border-slate-100 last:border-0">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="text-sm font-semibold focus:outline-none bg-transparent hover:text-primary transition-colors cursor-pointer"
                                />
                                <span className="text-slate-300">to</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="text-sm font-semibold focus:outline-none bg-transparent hover:text-primary transition-colors cursor-pointer"
                                />
                            </div>

                            <div className="flex items-center gap-2 px-3 py-1.5 border-r border-slate-100 last:border-0">
                                <Layers className="w-4 h-4 text-slate-400" />
                                <select
                                    value={selectedProduct}
                                    onChange={(e) => setSelectedProduct(e.target.value)}
                                    className="text-sm font-semibold focus:outline-none bg-transparent cursor-pointer hover:text-primary"
                                >
                                    {productOptions.map(opt => <option key={opt} value={opt}>{opt === 'All' ? 'All Products' : opt}</option>)}
                                </select>
                            </div>

                            <div className="flex items-center gap-2 px-3 py-1.5 last:border-0">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <select
                                    value={selectedChannel}
                                    onChange={(e) => setSelectedChannel(e.target.value)}
                                    className="text-sm font-semibold focus:outline-none bg-transparent cursor-pointer hover:text-primary"
                                >
                                    {channelOptions.map(opt => <option key={opt} value={opt}>{opt === 'All' ? 'All Channels' : opt}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Simple Metrics Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="Revenue" value={stats?.totalRevenue} icon={DollarSign} trend="up" trendValue="12.5%" color="text-blue-600 bg-blue-50" />
                        <StatCard title="Orders" value={stats?.totalOrders} icon={ShoppingBag} trend="up" trendValue="8.2%" color="text-purple-600 bg-purple-50" />
                        <StatCard title="Net Profit" value={stats?.totalProfit} icon={TrendingUp} trend="up" trendValue="4.1%" color="text-emerald-600 bg-emerald-50" />
                        <StatCard title="AOV" value={stats?.aov} icon={Users} trend="down" trendValue="1.2%" color="text-orange-600 bg-orange-50" />
                    </div>

                    {/* Quick Data Insights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <InsightCard
                            label="Best Product"
                            value={dataInsights?.bestProduct}
                            description="Highest revenue contributor"
                            icon={Sparkles}
                            color="text-amber-600 bg-amber-50"
                        />
                        <InsightCard
                            label="Star Channel"
                            value={dataInsights?.bestChannel}
                            description="Highest order volume"
                            icon={Zap}
                            color="text-indigo-600 bg-indigo-50"
                        />
                        <InsightCard
                            label="Peak Revenue Day"
                            value={dataInsights?.peakDay}
                            description="Single day performance high"
                            icon={Calendar}
                            color="text-rose-600 bg-rose-50"
                        />
                        <InsightCard
                            label="Conversion King"
                            value={dataInsights?.bestConv}
                            description="Highest customer/visitor ratio"
                            icon={TrendingUp}
                            color="text-cyan-600 bg-cyan-50"
                        />
                    </div>

                    {/* AI Insights Panel */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden border-l-[6px] border-l-primary leading-relaxed">
                        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Cpu className="text-primary w-5 h-5" />
                                    <h3 className="text-xl font-bold text-slate-800">AI Business Advisor</h3>
                                </div>
                                <p className="text-sm text-slate-500 italic">Generate strategic insights using your chosen Gemini model.</p>
                            </div>
                            <button
                                onClick={generateAIInsights}
                                disabled={generating}
                                className={cn(
                                    "px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm",
                                    generating ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-primary text-white hover:bg-blue-600 active:scale-95"
                                )}
                            >
                                {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {generating ? 'Processing Data...' : 'Generate New Insights'}
                            </button>
                        </div>

                        {!aiInsights && !generating && (
                            <div className="p-12 text-center">
                                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="text-slate-300 w-8 h-8" />
                                </div>
                                <h4 className="text-slate-800 font-bold mb-1 border-none bg-transparent">Ready to Analyze</h4>
                                <p className="text-slate-500 text-sm max-w-sm mx-auto">Enter your API key and click the button above to get AI-powered strategy recommendations based on your current filters.</p>
                            </div>
                        )}

                        {generating && (
                            <div className="p-12 space-y-4">
                                <div className="h-4 bg-slate-100 rounded-full w-3/4 animate-pulse mx-auto"></div>
                                <div className="h-4 bg-slate-100 rounded-full w-1/2 animate-pulse mx-auto"></div>
                                <div className="h-4 bg-slate-100 rounded-full w-2/3 animate-pulse mx-auto"></div>
                            </div>
                        )}

                        {aiInsights && (
                            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Alerts */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-rose-600 font-bold uppercase text-xs tracking-widest bg-rose-50 w-fit px-2.5 py-1 rounded-lg">
                                        <AlertCircle className="w-3 h-3" />
                                        Alerts
                                    </div>
                                    <ul className="space-y-3">
                                        {aiInsights.alerts.map((item, i) => (
                                            <li key={i} className="text-sm text-slate-700 bg-rose-50/30 p-3 rounded-xl border border-rose-100/50 leading-snug">
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Opportunities */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-widest bg-blue-50 w-fit px-2.5 py-1 rounded-lg">
                                        <Zap className="w-3 h-3" />
                                        Opportunities
                                    </div>
                                    <ul className="space-y-3">
                                        {aiInsights.opportunities.map((item, i) => (
                                            <li key={i} className="text-sm text-slate-700 bg-blue-50/30 p-3 rounded-xl border border-blue-100/50 leading-snug">
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Suggestions */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-emerald-600 font-bold uppercase text-xs tracking-widest bg-emerald-50 w-fit px-2.5 py-1 rounded-lg">
                                        <Lightbulb className="w-3 h-3" />
                                        Suggestions
                                    </div>
                                    <ul className="space-y-3">
                                        {aiInsights.suggestions.map((item, i) => (
                                            <li key={i} className="text-sm text-slate-700 bg-emerald-50/30 p-3 rounded-xl border border-emerald-100/50 leading-snug">
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm leading-relaxed">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue Trend</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData.revenueTrend}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']} />
                                        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm leading-relaxed">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">By Channel</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={chartData.revenueByChannel} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {chartData.revenueByChannel.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm leading-relaxed">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">Top Products</h3>
                            <div className="h-[432px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData.topProducts} layout="vertical" margin={{ left: -20, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} width={100} />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']} />
                                        <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-800 leading-relaxed">Transaction History</h3>
                                <span className="text-sm font-medium text-slate-400">{filteredData.length} total records</span>
                            </div>
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Channel</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Revenue</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredData.slice(0, 10).map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-slate-600 font-medium whitespace-nowrap">{row.date}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-slate-900 leading-tight">{row.product}</td>
                                                <td className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">{row.channel}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right leading-tight">${(row.revenue || 0).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700">COMPLETED</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
