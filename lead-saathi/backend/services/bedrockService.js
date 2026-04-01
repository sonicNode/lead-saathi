exports.extractBANT = async (transcript) => {
  console.log("Mocking Amazon Bedrock BANT extraction...");
  const text = transcript.toLowerCase();
  
  const budget = text.includes('budget') || text.includes('$') || text.includes('price') || text.includes('dollars') || text.includes('k') ? "Identified" : "Unknown";
  const need = text.includes('looking for') || text.includes('buy') || text.includes('need') || text.includes('licenses') || text.includes('want') ? "Clear Need" : "Unknown";
  const authority = text.includes('director') || text.includes('manager') || text.includes('ceo') ? "Decision Maker" : "Unknown";
  const timeline = text.includes('month') || text.includes('soon') || text.includes('urgent') || text.includes('next') ? "Short Term" : "Unknown";

  return {
    budget,
    need,
    authority,
    timeline,
    intent_score: 8
  };
};
