/**
 * Debug utility to log data flow and identify issues with consensus data
 */

export function debugConsensusData(data: any, source: string) {
  console.log(`🔍 DEBUG [${source}] - Data structure:`, {
    hasConsensus: !!data?.consensus,
    consensusType: typeof data?.consensus,
    consensusKeys: data?.consensus ? Object.keys(data.consensus) : [],
    signalDetailsCount: data?.consensus?.signal_details?.length || 0,
    signalDetails: data?.consensus?.signal_details || [],
    hasIndicators: !!data?.indicators,
    hasTechnicalIndicators: !!data?.technical_indicators,
    indicatorsKeys: data?.indicators ? Object.keys(data.indicators) : [],
    technicalIndicatorsKeys: data?.technical_indicators ? Object.keys(data?.technical_indicators) : []
  });
}

export function debugSignalDetails(signalDetails: any[], source: string) {
  console.log(`🔍 DEBUG [${source}] - Signal Details:`, {
    count: signalDetails.length,
    details: signalDetails.map((detail, index) => ({
      index,
      indicator: detail.indicator,
      signal: detail.signal,
      value: detail.value,
      description: detail.description
    }))
  });
}
