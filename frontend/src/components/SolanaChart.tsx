import React from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';

interface SolanaChartProps {
  symbol: string;
}

const SolanaChart: React.FC<SolanaChartProps> = ({ symbol }) => {
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <AdvancedRealTimeChart
        theme="dark"
        symbol={symbol}
        width="100%"
        height="100%"
        interval="1D"
        timezone="Etc/UTC"
        style="1"
        locale="en"
        withdateranges
        allow_symbol_change={false}
        hide_side_toolbar={false}
      />
    </div>
  );
};

export default SolanaChart;
