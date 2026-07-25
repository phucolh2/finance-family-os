import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Scale, ShieldCheck, AlertTriangle, Wallet, TrendingDown, CalendarCheck, Lightbulb, ArrowRightLeft, Heart, Target, Percent } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { formatKpiMoneyVNDMillion, formatMoneyVNDMillion } from '../utils/format';
import { DebtLiabilityModule } from '../components/portfolio/DebtLiabilityModule';
import { calculatePMT, safeNumber } from '../utils/math';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { ObservationControls } from '../components/ui/ObservationControls';
import { runProjection } from '../engines/projectionEngine';
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, Legend } from 'recharts';

export const DebtManagement: React.FC = () => {
    const { state, selectedPeriodKey } = useAppContext();

    const projection = runProjection({
        profile: state.profile,
        incomeSchedule: state.incomeSchedule,
        budgetSchedule: state.budgetSchedule,
        lifeEvents: state.lifeEvents,
        assets: state.assets,
        assumptions: state.assumptions,
        investmentDeals: state.investmentDeals,
        savingsDeposits: state.savingsDeposits,
        projectionAdjustments: state.projectionAdjustments,
        lifeStages: state.lifeStages,
        fundTransfers: state.fundTransfers,
    });

    const hasData = projection.monthlyRows.length > 0;
    const now = new Date();
    const nowMonth = now.getMonth() + 1;
    const nowYear = now.getFullYear();
    const nowKey = `${nowYear}-${String(nowMonth).padStart(2, '0')}`;
    const currentPeriod = hasData ? (projection.monthlyRows.find(r => r.period.key === nowKey) || projection.monthlyRows[0]) : null;
    const activeRow = (hasData && selectedPeriodKey) ? (projection.monthlyRows.find(r => r.period.key === selectedPeriodKey) || currentPeriod) : currentPeriod;

    const activeDebts = (state.debts || []).filter(d => d.status === 'active');
    
    // KPIs Calculations
    const totalOriginalPrincipal = activeDebts.reduce((sum, d) => sum + safeNumber(d.principal, 0), 0);
    const totalDebtRemaining = safeNumber(activeRow?._totalDebtPrincipalRemaining, 0);
    const totalDebtMonthlyPayment = activeDebts.reduce((sum, d) => sum + calculatePMT(d.principal, d.interestRateAnnual, d.termMonths), 0);
    
    // 28/36 Rule Calculations
    const monthlyIncome = activeRow ? safeNumber(activeRow.incomeMonthly, 0) : 0;
    const housingMonthlyPayment = activeDebts.filter(d => d.type === 'mortgage').reduce((sum, d) => sum + calculatePMT(d.principal, d.interestRateAnnual, d.termMonths), 0);
    const housingDTI = monthlyIncome > 0 ? (housingMonthlyPayment / monthlyIncome) * 100 : 0;
    const totalDTI = monthlyIncome > 0 ? (totalDebtMonthlyPayment / monthlyIncome) * 100 : 0;
    
    // Debt Progress
    const debtPaidAmount = Math.max(0, totalOriginalPrincipal - totalDebtRemaining);
    const debtProgressPercent = totalOriginalPrincipal > 0 ? (debtPaidAmount / totalOriginalPrincipal) * 100 : 0;

    // Interest Rate Arbitrage
    const maxDebtRate = activeDebts.length > 0 ? Math.max(...activeDebts.map(d => d.interestRateAnnual)) : 0;
    const activeSavings = (state.savingsDeposits || []).filter(s => s.status === 'active');
    const maxSavingsRate = activeSavings.length > 0 ? Math.max(...activeSavings.map(s => s.interestRateAnnual)) : (state.assumptions?.savingsInterestRateAnnual || 5.5);
    const rateDiff = maxDebtRate - maxSavingsRate;

    const debtReserveBalance = (activeRow?.debtReserveBalance || 0) + (activeRow?._activeSinkingFundsDebtReserve || 0);

    const debtFreeDate = useMemo(() => {
        if (activeDebts.length === 0) return null;
        let latestEndMonth = 0;
        let latestEndYear = 0;
        activeDebts.forEach(d => {
            const endTotalMonths = (d.startYear * 12 + d.startMonth) + d.termMonths;
            const endYear = Math.floor((endTotalMonths - 1) / 12);
            const endMonth = ((endTotalMonths - 1) % 12) + 1;
            if (endYear > latestEndYear || (endYear === latestEndYear && endMonth > latestEndMonth)) {
                latestEndYear = endYear;
                latestEndMonth = endMonth;
            }
        });
        return { month: latestEndMonth, year: latestEndYear };
    }, [activeDebts]);

    const chartData = useMemo(() => {
        return projection.monthlyRows.map(row => ({
            key: row.period.key,
            label: `T${row.period.month}/${row.period.year}`,
            debtRemaining: safeNumber(row._totalDebtPrincipalRemaining, 0),
            reserveBalance: safeNumber(row.debtReserveBalance, 0) + safeNumber(row._activeSinkingFundsDebtReserve, 0),
            netPosition: (safeNumber(row.debtReserveBalance, 0) + safeNumber(row._activeSinkingFundsDebtReserve, 0)) - safeNumber(row._totalDebtPrincipalRemaining, 0),
        }));
    }, [projection.monthlyRows]);

    const getHeroCardProps = () => {
        if (activeDebts.length === 0) {
            return {
                bg: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
                icon: <Heart className="w-12 h-12 text-emerald-400 mb-4" />,
                title: 'Tuyệt vời! Gia đình bạn không có khoản nợ nào — Tự do tài chính hoàn toàn.',
                subtitle: 'Hãy duy trì thói quen chi tiêu lành mạnh và tiếp tục tích lũy tài sản.',
                textColor: 'text-emerald-300'
            };
        }
        if (totalDTI < 30) {
            return {
                bg: 'bg-gradient-to-r from-emerald-500/20 to-green-500/10 border-emerald-500/30',
                icon: <ShieldCheck className="w-12 h-12 text-emerald-400 mb-4" />,
                title: 'Gia đình bạn đang kiểm soát tốt các khoản nợ.',
                subtitle: `Tỷ lệ nợ/thu nhập (DTI) ở mức an toàn: ${totalDTI.toFixed(1)}%.`,
                textColor: 'text-emerald-300'
            };
        }
        if (totalDTI <= 50) {
            return {
                bg: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-500/30',
                icon: <AlertTriangle className="w-12 h-12 text-yellow-400 mb-4" />,
                title: 'Có khoản nợ cần lưu ý — Tỷ lệ nợ/thu nhập đang ở mức trung bình.',
                subtitle: `DTI hiện tại là ${totalDTI.toFixed(1)}%. Hãy cẩn trọng trước khi nhận thêm nợ mới.`,
                textColor: 'text-yellow-300'
            };
        }
        return {
            bg: 'bg-gradient-to-r from-red-500/20 to-rose-500/10 border-red-500/30',
            icon: <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />,
            title: 'Cảnh báo — Nghĩa vụ nợ vượt ngưỡng an toàn.',
            subtitle: `DTI hiện tại lên tới ${totalDTI.toFixed(1)}%. Cần ưu tiên giảm nợ và cắt giảm chi tiêu ngay lập tức.`,
            textColor: 'text-red-300'
        };
    };

    const heroProps = getHeroCardProps();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-family-text flex items-center gap-2">
                        <Scale className="w-8 h-8 text-family-accent" />
                        Quản lý Công Nợ Gia đình
                        <HelpTooltip text="Quản lý toàn diện các khoản vay, đánh giá sức khỏe nợ và lập kế hoạch tất toán hiệu quả." />
                    </h1>
                    <p className="text-family-textMuted mt-1">
                        Kiểm soát nghĩa vụ — Bảo vệ dòng tiền — An tâm tài chính
                    </p>
                </div>
                <ObservationControls />
            </div>

            {/* Layer 1: Sức khỏe Tổng quan & KPIs */}
            <Card className={`border ${heroProps.bg}`}>
                <CardContent className="pt-6 flex flex-col items-center text-center">
                    {heroProps.icon}
                    <h2 className={`text-xl font-semibold mb-2 ${heroProps.textColor}`}>{heroProps.title}</h2>
                    <p className="text-family-textMuted">{heroProps.subtitle}</p>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-family-bgDark border-family-accent/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-family-textMuted flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-red-400" />
                            Dư Nợ Còn Lại
                            <HelpTooltip text="Tổng số tiền gốc còn lại cần phải thanh toán cho tất cả các khoản vay tính đến tháng quan sát." />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-400">
                            {formatKpiMoneyVNDMillion(totalDebtRemaining)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-family-bgDark border-family-accent/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-family-textMuted flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-orange-400" />
                            Trả Hàng Tháng
                            <HelpTooltip text="Tổng số tiền gốc và lãi ước tính phải trả mỗi tháng (theo phương pháp PMT)." />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-400">
                            {formatKpiMoneyVNDMillion(totalDebtMonthlyPayment)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-family-bgDark border-family-accent/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-family-textMuted flex items-center gap-2">
                            <Scale className="w-4 h-4 text-blue-400" />
                            Tỷ lệ Nợ/Thu nhập
                            <HelpTooltip text="Tỷ lệ thanh toán nợ hàng tháng trên tổng thu nhập (DTI). Dưới 36% là tiêu chuẩn an toàn thế giới." />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${totalDTI < 36 ? 'text-emerald-400' : totalDTI <= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {totalDTI.toFixed(1)}%
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-family-bgDark border-family-accent/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-family-textMuted flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-amber-400" />
                            Quỹ Dự phòng Nợ
                            <HelpTooltip text="Tổng tiền mặt đang có để dự phòng tất toán hoặc thanh toán nợ khi gặp rủi ro." />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-400">
                            {formatKpiMoneyVNDMillion(debtReserveBalance)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Layer 2: Phân tích Chuyên sâu (Chỉ số chuẩn & Tiến độ) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* 28/36 Rule Metrics */}
                    <Card className="bg-family-bgDeep border-family-accent/10">
                        <CardHeader>
                            <CardTitle className="text-base text-family-text flex items-center gap-2">
                                <Target className="w-5 h-5 text-blue-400" />
                                Chỉ số An toàn Thế giới (Quy tắc 28/36)
                                <HelpTooltip text="Tiêu chuẩn quản lý nợ kinh điển: Nợ nhà ở ≤ 28% và Tổng nợ ≤ 36% thu nhập hàng tháng." />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-family-textMuted">Nợ Nhà ở (Front-end Ratio)</span>
                                    <span className={`font-bold ${housingDTI <= 28 ? 'text-emerald-400' : 'text-red-400'}`}>{housingDTI.toFixed(1)}% / 28%</span>
                                </div>
                                <div className="w-full bg-gray-700 h-2.5 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-2.5 rounded-full ${housingDTI <= 28 ? 'bg-emerald-500' : 'bg-red-500'}`} 
                                        style={{ width: `${Math.min(housingDTI, 100)}%` }}
                                    ></div>
                                </div>
                                {housingDTI > 28 && <p className="text-xs text-red-400/80 mt-1">Nghĩa vụ trả nợ nhà đang quá cao so với chuẩn an toàn.</p>}
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-family-textMuted">Tổng Nợ (Back-end Ratio)</span>
                                    <span className={`font-bold ${totalDTI <= 36 ? 'text-emerald-400' : totalDTI <= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{totalDTI.toFixed(1)}% / 36%</span>
                                </div>
                                <div className="w-full bg-gray-700 h-2.5 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-2.5 rounded-full ${totalDTI <= 36 ? 'bg-emerald-500' : totalDTI <= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                        style={{ width: `${Math.min(totalDTI, 100)}%` }}
                                    ></div>
                                </div>
                                {totalDTI > 36 && <p className="text-xs text-red-400/80 mt-1">Tổng nghĩa vụ nợ đã vượt ngưỡng tiêu chuẩn, dòng tiền gia đình đang gặp rủi ro.</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Debt Progress & Interest Alert */}
                    <div className="space-y-4">
                        <Card className="bg-family-bgDeep border-family-accent/10">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base text-family-text flex items-center gap-2">
                                    <Percent className="w-5 h-5 text-emerald-400" />
                                    Tiến độ Trả Nợ Tổng thể
                                    <HelpTooltip text="Phần trăm dư nợ gốc gia đình đã thanh toán được tính đến thời điểm hiện tại." />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-end justify-between mb-2">
                                    <div className="text-3xl font-bold text-emerald-400">{debtProgressPercent.toFixed(1)}%</div>
                                    <div className="text-sm text-family-textMuted text-right">
                                        Đã trả: {formatMoneyVNDMillion(debtPaidAmount)}<br/>
                                        / Tổng gốc: {formatMoneyVNDMillion(totalOriginalPrincipal)}
                                    </div>
                                </div>
                                <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden">
                                    <div className="h-3 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" style={{ width: `${debtProgressPercent}%` }}></div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Interest Rate Arbitrage Warning */}
                        <Card className={`border ${rateDiff > 2 ? 'border-red-500/50 bg-red-500/5' : 'border-family-accent/10 bg-family-bgDeep'}`}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base text-family-text flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ArrowRightLeft className={`w-5 h-5 ${rateDiff > 2 ? 'text-red-400' : 'text-blue-400'}`} />
                                        Cảnh báo Chênh lệch Lãi suất
                                    </div>
                                    <HelpTooltip text="So sánh lãi suất vay cao nhất và lãi suất gửi tiết kiệm cao nhất (hoặc lạm phát). Chênh lệch > 2% là rủi ro 'bẫy chuột'." />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="text-center">
                                        <div className="text-xs text-family-textMuted uppercase mb-1">Lãi tiết kiệm (Max)</div>
                                        <div className="text-lg font-bold text-emerald-400">{maxSavingsRate.toFixed(1)}%</div>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center px-4">
                                        <div className="w-full h-1 bg-gray-700 rounded-full relative">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-family-bgDark border border-gray-600 flex items-center justify-center text-xs text-gray-400">vs</div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-family-textMuted uppercase mb-1">Lãi nợ vay (Max)</div>
                                        <div className="text-lg font-bold text-red-400">{maxDebtRate.toFixed(1)}%</div>
                                    </div>
                                </div>
                                {rateDiff > 2 && (
                                    <div className="mt-4 p-2 bg-red-500/10 rounded text-sm text-red-400 flex gap-2">
                                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <span>Lãi vay đang cao hơn tiền gửi <strong>{rateDiff.toFixed(1)}%</strong>. Hãy cân nhắc rút tiết kiệm để tất toán nợ khẩn cấp!</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

            {/* Layer 3: Biểu đồ & Lời khuyên */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Card className="bg-family-bgDark border-family-accent/10 h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-family-text">
                                    📊 Hành trình Thoát Nợ (Debt-Free Horizon)
                                    <HelpTooltip text="Biểu đồ minh họa sự suy giảm của dư nợ theo thời gian và sự gia tăng của quỹ dự phòng nợ. Điểm giao cắt là lúc bạn có thể tất toán toàn bộ." />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorReserve" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                            <XAxis dataKey="label" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                                formatter={(value: any) => formatMoneyVNDMillion(Number(value))}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                            <Area type="monotone" dataKey="debtRemaining" name="Dư nợ còn lại" stroke="#ef4444" fillOpacity={1} fill="url(#colorDebt)" />
                                            <Area type="monotone" dataKey="reserveBalance" name="Quỹ dự phòng" stroke="#f59e0b" fillOpacity={1} fill="url(#colorReserve)" />
                                            <Line type="monotone" dataKey="netPosition" name="Vị thế Ròng" stroke="#3b82f6" strokeDasharray="5 5" dot={false} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                                {debtFreeDate && (
                                    <div className="mt-4 p-3 bg-family-bgDeep rounded-lg border border-family-accent/10 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CalendarCheck className="w-5 h-5 text-emerald-400" />
                                            <span className="text-family-text font-medium">Dự kiến Thoát Nợ:</span>
                                        </div>
                                        <span className="text-lg font-bold text-emerald-400">
                                            Tháng {debtFreeDate.month}/{debtFreeDate.year}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <Card className="bg-family-bgDark border-family-accent/10 h-full">
                            <CardHeader>
                                <CardTitle className="text-family-text flex items-center gap-2">
                                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                                    💡 Chiến lược Tài chính
                                    <HelpTooltip text="Lời khuyên dựa trên tình trạng nợ và dòng tiền thực tế." />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {totalDTI > 36 && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                        <h4 className="font-medium text-red-400 mb-1 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" /> Báo động Dòng tiền
                                        </h4>
                                        <p className="text-sm text-family-textMuted">Tỷ lệ nợ/thu nhập vượt ngưỡng 36%. Cắt giảm chi tiêu không thiết yếu ngay và không nhận thêm nợ.</p>
                                    </div>
                                )}
                                {activeDebts.length > 1 && (
                                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <h4 className="font-medium text-blue-400 mb-1 flex items-center gap-2">
                                            <TrendingDown className="w-4 h-4" /> Phá Băng (Avalanche)
                                        </h4>
                                        <p className="text-sm text-family-textMuted">Bạn có {activeDebts.length} khoản vay. Hãy tập trung dồn tiền tất toán khoản nợ có lãi suất {maxDebtRate}% trước để tối ưu tiền lãi.</p>
                                    </div>
                                )}
                                <div className="p-3 bg-family-bgDeep border border-family-accent/10 rounded-lg">
                                    <h4 className="font-medium text-family-text mb-1 flex items-center gap-2">
                                        <Wallet className="w-4 h-4 text-amber-400" /> Thanh khoản là vua
                                    </h4>
                                    <p className="text-sm text-family-textMuted">Hãy duy trì ít nhất 3 tháng chi tiêu trong quỹ Khẩn cấp trước khi dồn toàn lực trả nợ để tránh phải vay lại.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

            {/* Layer 4: Bảng Quản trị Thực thi (Full Width) */}
            <div className="mt-8">
                <DebtLiabilityModule />
            </div>
        </div>
    );
};
