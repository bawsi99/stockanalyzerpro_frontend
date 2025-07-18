import { 
  SectorBenchmarking, 
  EnhancedOverlays, 
  SectorContext,
  EnhancedAIAnalysis 
} from '@/types/analysis';

// Test Price Statistics Data
export const testPriceStatistics = {
  mean: 2450.75,
  max: 2850.00,
  min: 2100.00,
  current: 2520.50,
  distFromMean: 69.75,
  distFromMax: -329.50,
  distFromMin: 420.50,
  distFromMeanPct: 2.85,
  distFromMaxPct: -11.56,
  distFromMinPct: 20.02
};

// Enhanced Sector Benchmarking Test Data
export const testSectorBenchmarking: SectorBenchmarking = {
  stock_symbol: "RELIANCE",
  sector_info: {
    sector: "OIL_GAS",
    sector_name: "Oil & Gas",
    sector_index: "NIFTY OIL AND GAS",
    sector_stocks_count: 15
  },
  market_benchmarking: {
    beta: 1.2,
    correlation: 0.85,
    sharpe_ratio: 1.8,
    volatility: 0.25,
    max_drawdown: -0.15,
    cumulative_return: 0.45,
    annualized_return: 0.18,
    risk_free_rate: 0.06,
    current_vix: 18.5,
    data_source: "NIFTY 50",
    data_points: 252
  },
  sector_benchmarking: {
    sector_beta: 1.1,
    sector_correlation: 0.92,
    sector_sharpe_ratio: 1.6,
    sector_volatility: 0.22,
    sector_max_drawdown: -0.12,
    sector_cumulative_return: 0.38,
    sector_annualized_return: 0.15,
    sector_index: "NIFTY OIL AND GAS",
    sector_data_points: 252
  },
  relative_performance: {
    vs_market: {
      performance_ratio: 0.15,
      risk_adjusted_ratio: 1.2,
      outperformance_periods: 65,
      underperformance_periods: 35,
      consistency_score: 0.75
    },
    vs_sector: {
      performance_ratio: 0.08,
      risk_adjusted_ratio: 1.1,
      sector_rank: 3,
      sector_percentile: 0.8,
      sector_consistency: 0.82
    }
  },
  sector_risk_metrics: {
    risk_score: 0.35,
    risk_level: "Medium",
    correlation_risk: "Moderate",
    momentum_risk: "Low",
    volatility_risk: "Medium",
    sector_stress_metrics: {
      stress_score: 0.28,
      stress_level: "Low",
      stress_factors: ["Oil price volatility", "Regulatory changes"]
    },
    risk_factors: [
      "Commodity price fluctuations",
      "Geopolitical risks",
      "Environmental regulations"
    ],
    risk_mitigation: [
      "Diversify across energy subsectors",
      "Monitor oil price trends",
      "Consider hedging strategies"
    ]
  },
  analysis_summary: {
    market_position: "Outperforming market with strong momentum",
    sector_position: "Leading sector performance with consistent returns",
    risk_assessment: "Moderate risk profile with good risk-adjusted returns",
    investment_recommendation: "Consider for portfolio allocation with sector rotation strategy"
  },
  timestamp: new Date().toISOString(),
  data_points: {
    stock_data_points: 252,
    market_data_points: 252,
    sector_data_points: 252
  }
};

// Enhanced Overlays Test Data
export const testEnhancedOverlays: EnhancedOverlays = {
  triangles: [
    {
      vertices: [
        { date: "2024-01-01", price: 1500 },
        { date: "2024-02-01", price: 1600 },
        { date: "2024-03-01", price: 1550 }
      ]
    }
  ],
  flags: [
    {
      start_date: "2024-01-15",
      end_date: "2024-02-15",
      start_price: 1550,
      end_price: 1650
    }
  ],
  support_resistance: {
    support: [
      { level: 1500 },
      { level: 1450 },
      { level: 1400 }
    ],
    resistance: [
      { level: 1700 },
      { level: 1750 },
      { level: 1800 }
    ]
  },
  double_tops: [
    {
      peak1: { date: "2024-01-10", price: 1650 },
      peak2: { date: "2024-02-10", price: 1655 }
    }
  ],
  double_bottoms: [
    {
      bottom1: { date: "2024-01-20", price: 1500 },
      bottom2: { date: "2024-02-20", price: 1505 }
    }
  ],
  divergences: [
    {
      type: "bullish",
      start_date: "2024-01-01",
      end_date: "2024-02-01",
      start_price: 1500,
      end_price: 1600,
      start_rsi: 30,
      end_rsi: 45
    }
  ],
  volume_anomalies: [
    {
      date: "2024-02-15",
      volume: 50000000,
      price: 1650
    }
  ],
  advanced_patterns: {
    head_and_shoulders: [
      {
        left_shoulder: { date: "2024-01-01", price: 1600 },
        head: { date: "2024-02-01", price: 1700 },
        right_shoulder: { date: "2024-03-01", price: 1610 },
        neckline: 1500
      }
    ],
    inverse_head_and_shoulders: [],
    cup_and_handle: [
      {
        cup_start: { date: "2024-01-01", price: 1500 },
        cup_bottom: { date: "2024-02-01", price: 1400 },
        cup_end: { date: "2024-03-01", price: 1500 },
        handle_start: { date: "2024-03-15", price: 1500 },
        handle_end: { date: "2024-04-01", price: 1450 }
      }
    ],
    triple_tops: [],
    triple_bottoms: [],
    wedge_patterns: [
      {
        start_date: "2024-01-01",
        end_date: "2024-03-01",
        upper_trend: [{ date: "2024-01-01", price: 1600 }, { date: "2024-03-01", price: 1650 }],
        lower_trend: [{ date: "2024-01-01", price: 1500 }, { date: "2024-03-01", price: 1550 }]
      }
    ],
    channel_patterns: [
      {
        start_date: "2024-01-01",
        end_date: "2024-03-01",
        upper_channel: 1700,
        lower_channel: 1500,
        touches: 5
      }
    ]
  }
};

// Sector Context Test Data
export const testSectorContext: SectorContext = {
  sector: "OIL_GAS",
  benchmarking: testSectorBenchmarking,
  rotation_insights: {
    sector_rank: 2,
    sector_performance: 0.15,
    rotation_strength: "Strong",
    leading_sectors: ["IT", "PHARMA", "BANKING"],
    lagging_sectors: ["METAL", "REALTY", "AUTO"],
    recommendations: [
      {
        type: "rotation",
        sector: "OIL_GAS",
        reason: "Strong momentum and sector rotation"
      }
    ]
  },
  correlation_insights: {
    average_correlation: 0.65,
    diversification_quality: "Good",
    sector_volatility: 0.22,
    high_correlation_sectors: [
      { sector: "ENERGY", correlation: 0.85 },
      { sector: "METAL", correlation: 0.78 }
    ],
    low_correlation_sectors: [
      { sector: "IT", correlation: 0.25 },
      { sector: "PHARMA", correlation: 0.18 }
    ]
  },
  trading_recommendations: [
    {
      type: "rotation",
      recommendation: "Buy",
      reason: "Strong sector momentum and rotation strength",
      confidence: "High"
    },
    {
      type: "diversification",
      recommendation: "Hold",
      message: "Consider IT and Pharma for diversification",
      priority: "Medium"
    }
  ]
};

// Enhanced AI Analysis Test Data
export const testEnhancedAIAnalysis: EnhancedAIAnalysis = {
  meta: {
    symbol: "RELIANCE",
    analysis_date: new Date().toISOString(),
    timeframe: "365 days",
    overall_confidence: 0.85,
    data_quality_score: 0.92
  },
  market_outlook: {
    primary_trend: {
      direction: "Bullish",
      strength: "Strong",
      duration: "3-6 months",
      confidence: 0.85,
      rationale: "Strong technical indicators and sector momentum"
    },
    secondary_trend: {
      direction: "Sideways",
      strength: "Weak",
      duration: "1-2 months",
      confidence: 0.65,
      rationale: "Short-term consolidation expected"
    },
    key_drivers: [
      {
        factor: "Sector rotation",
        impact: "Positive",
        timeframe: "Medium-term"
      },
      {
        factor: "Oil price stability",
        impact: "Positive",
        timeframe: "Short-term"
      }
    ]
  },
  trading_strategy: {
    short_term: {
      horizon_days: 30,
      bias: "Bullish",
      entry_strategy: {
        type: "Breakout",
        entry_range: [1650, 1700],
        entry_conditions: ["Price above 1650", "Volume confirmation"],
        confidence: 0.75
      },
      exit_strategy: {
        stop_loss: 1600,
        stop_loss_type: "Technical",
        targets: [1750, 1800, 1850],
        trailing_stop: {
          enabled: true,
          method: "ATR-based",
          multiplier: 2
        }
      },
      position_sizing: {
        risk_per_trade: "2%",
        max_position_size: "10%",
        atr_multiplier: 2
      },
      rationale: "Strong technical setup with sector support"
    },
    medium_term: {
      horizon_days: 90,
      bias: "Bullish",
      entry_strategy: {
        type: "Pullback",
        entry_range: [1600, 1650],
        entry_conditions: ["RSI oversold", "Support level"],
        confidence: 0.80
      },
      exit_strategy: {
        stop_loss: 1550,
        stop_loss_type: "Support",
        targets: [1800, 1900, 2000],
        trailing_stop: {
          enabled: true,
          method: "Percentage",
          multiplier: 5
        }
      },
      position_sizing: {
        risk_per_trade: "3%",
        max_position_size: "15%",
        atr_multiplier: 3
      },
      rationale: "Medium-term uptrend with strong fundamentals"
    },
    long_term: {
      horizon_days: 365,
      investment_rating: "Buy",
      fair_value_range: [1800, 2200],
      key_levels: {
        accumulation_zone: [1500, 1600],
        distribution_zone: [2000, 2200]
      },
      rationale: "Strong long-term growth prospects with sector leadership"
    }
  },
  risk_management: {
    key_risks: [
      {
        risk: "Oil price volatility",
        probability: "Medium",
        impact: "High",
        mitigation: "Monitor oil price trends and hedge if necessary"
      },
      {
        risk: "Regulatory changes",
        probability: "Low",
        impact: "Medium",
        mitigation: "Stay informed about policy developments"
      }
    ],
    stop_loss_levels: [
      {
        level: 1600,
        type: "Technical",
        rationale: "Key support level"
      },
      {
        level: 1550,
        type: "Risk management",
        rationale: "2% portfolio risk"
      }
    ],
    position_management: {
      scaling_in: true,
      scaling_out: true,
      max_correlation: 0.7
    }
  },
  critical_levels: {
    must_watch: [
      {
        level: 1650,
        type: "Resistance",
        significance: "Key breakout level",
        action: "Buy on breakout with volume confirmation"
      }
    ],
    confirmation_levels: [
      {
        level: 1700,
        condition: "Price sustains above 1700",
        action: "Add to position"
      }
    ]
  },
  monitoring_plan: {
    daily_checks: [
      "Monitor oil price movements",
      "Check volume patterns",
      "Track sector rotation"
    ],
    weekly_reviews: [
      "Review technical indicators",
      "Assess sector performance",
      "Update risk metrics"
    ],
    exit_triggers: [
      {
        condition: "Price breaks below 1600",
        action: "Reduce position size"
      }
    ]
  },
  data_quality_assessment: {
    issues: [
      {
        issue: "Limited historical data for new patterns",
        impact: "Low",
        mitigation: "Use conservative estimates"
      }
    ],
    confidence_adjustments: {
      reason: "High data quality with comprehensive indicators",
      adjustment: "Increase confidence by 5%"
    }
  },
  key_takeaways: [
    "Strong technical setup with sector momentum",
    "Consider for portfolio allocation",
    "Monitor oil price trends closely",
    "Use proper risk management"
  ],
  indicator_summary_md: "## Technical Analysis Summary\n\nStrong bullish signals across multiple timeframes...",
  chart_insights: "Chart analysis reveals strong support at 1600 and resistance at 1700...",
  sector_context: testSectorContext
}; 