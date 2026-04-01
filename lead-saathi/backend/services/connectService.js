exports.simulateCall = async (data) => {
  console.log("Mocking Amazon Connect Call Trigger...");
  return { status: "Success", callId: "mock-call-12345", message: "Call initiated successfully." };
};
