/**
 * Utility functions for diversification quality interpretation
 */

export interface DiversificationInterpretation {
  quality: string;
  shortInterpretation: string;
  longInterpretation: string;
  colorClass: string;
  recommendation: string;
}

/**
 * Get short interpretation for diversification quality (for display below badges)
 * Each line contains exactly 5 words for consistency
 */
export const getDiversificationInterpretation = (quality: string): string => {
  switch (quality.toLowerCase()) {
    case 'excellent': 
      return 'Sectors move very independently.\nExcellent for risk reduction.';
    case 'good': 
      return 'Good diversification potential available.\nSectors provide meaningful protection.';
    case 'moderate': 
      return 'Limited diversification benefit here.\nSectors move together during stress.';
    case 'poor': 
      return 'Poor diversification - high correlation.\nSeek alternative asset classes.';
    default: 
      return 'Quality assessment currently unavailable.';
  }
};

/**
 * Get comprehensive diversification interpretation with recommendations
 */
export const getComprehensiveDiversificationInterpretation = (quality: string): DiversificationInterpretation => {
  switch (quality.toLowerCase()) {
    case 'excellent':
      return {
        quality: 'excellent',
        shortInterpretation: 'Sectors move independently - excellent for risk reduction.',
        longInterpretation: 'Sectors demonstrate low correlation (< 30%), providing excellent diversification benefits. Portfolio risk can be significantly reduced through strategic sector allocation.',
        colorClass: 'bg-green-100 text-green-800',
        recommendation: 'Utilize sector diversification as primary risk management strategy. Spread investments across multiple sectors and rebalance regularly.'
      };
    case 'good':
      return {
        quality: 'good',
        shortInterpretation: 'Good diversification potential - meaningful risk reduction.',
        longInterpretation: 'Sectors show moderate independence (30-50% correlation), offering good diversification opportunities. Risk reduction through sector allocation is achievable.',
        colorClass: 'bg-blue-100 text-blue-800',
        recommendation: 'Focus on sector allocation as key diversification strategy. Monitor correlations and adjust positions based on sector rotation patterns.'
      };
    case 'moderate':
      return {
        quality: 'moderate',
        shortInterpretation: 'Limited benefit - sectors often move together during stress.',
        longInterpretation: 'Sectors exhibit significant correlation (50-70%), limiting diversification effectiveness. During market stress, multiple sectors tend to move together.',
        colorClass: 'bg-yellow-100 text-yellow-800',
        recommendation: 'Complement sector allocation with asset class diversification (bonds, commodities, international equities). Use additional risk management tools.'
      };
    case 'poor':
      return {
        quality: 'poor',
        shortInterpretation: 'Poor diversification - seek alternative asset classes.',
        longInterpretation: 'Sectors are highly correlated (> 70%), providing minimal diversification benefits. Most sectors will likely move together during market downturns.',
        colorClass: 'bg-red-100 text-red-800',
        recommendation: 'Look beyond domestic sectors for diversification. Consider international exposure, alternative investments (REITs, commodities), and active risk management.'
      };
    default:
      return {
        quality: 'unknown',
        shortInterpretation: 'Quality assessment unavailable.',
        longInterpretation: 'Diversification quality could not be determined due to insufficient data or calculation errors.',
        colorClass: 'bg-gray-100 text-gray-800',
        recommendation: 'Ensure sufficient historical data is available for proper correlation analysis.'
      };
  }
};

/**
 * Get color class for diversification quality badges
 */
export const getDiversificationQualityColor = (quality: string): string => {
  switch (quality.toLowerCase()) {
    case 'excellent': return 'bg-green-100 text-green-800';
    case 'good': return 'bg-blue-100 text-blue-800';
    case 'moderate': return 'bg-yellow-100 text-yellow-800';
    case 'poor': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get very short interpretation for compact displays (5 words max)
 */
export const getCompactDiversificationInterpretation = (quality: string): string => {
  switch (quality.toLowerCase()) {
    case 'excellent': return 'Independent sectors, excellent risk reduction';
    case 'good': return 'Good diversification potential available here';
    case 'moderate': return 'Limited benefit, sectors move together';
    case 'poor': return 'High correlation, seek other assets';
    default: return 'Assessment currently unavailable';
  }
};
