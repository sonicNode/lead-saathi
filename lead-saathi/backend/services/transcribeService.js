exports.mockTranscribe = async (input) => {
  console.log("Mocking Amazon Transcribe...");
  if (input && input.length > 5) return input;
  return "Hello, I am looking to buy 50 enterprise licenses by next month, and I have a budget of $10,000. I am the IT director.";
};
