import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';

export const ScenarioBase: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-family-text">Kịch bản gốc</h1>
        <p className="text-sm text-family-textMuted mt-1">Mô phỏng tài chính trong điều kiện cơ bản, chưa phát sinh sự kiện lớn.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dự phóng kịch bản cơ bản</CardTitle>
          <CardDescription>Bức tranh tài sản dài hạn khi tích lũy có kỷ luật.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState />
        </CardContent>
      </Card>
    </div>
  );
};
