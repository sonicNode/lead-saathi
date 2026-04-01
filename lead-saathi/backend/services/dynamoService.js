exports.saveLead = async (leadData) => {
  console.log("Mocking Amazon DynamoDB Lead Save...");
  const leadRecord = {
    id: `lead_${Math.floor(Math.random() * 10000)}`,
    ...leadData,
    createdAt: new Date().toISOString()
  };
  return { success: true, record: leadRecord };
};
