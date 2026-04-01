exports.generateAudio = async (text) => {
  console.log("Mocking Amazon Polly Audio Generation...");
  return { 
    audioUrl: "mock-audio-placeholder",
    textResponse: text || "Thank you for the information. Our sales team will evaluate your requirements and contact you shortly to schedule a demo." 
  };
};
