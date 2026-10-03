const { seedDatabase } = require('../db/seed');
const { analyzePatentNovelty } = require('./similarity');

async function test() {
  console.log("Testing NLP Engine & Database...");
  
  // Seed first
  await seedDatabase();
  
  // Test input resembling the transformer legal model (US-11048956-B2)
  const testTitle = "Transformer based legal analyzer for clauses";
  const testAbstract = "An intelligent software system utilizing transformer neural network models to scan and analyze contract clauses and legal papers. It labels limitation of liability and indemnification sections and checks for anomalies.";
  const testDescription = "The system uses deep learning self-attention mechanisms to parse legal drafts. By training a model on case files and law publications, it creates embeddings representing clause segments. An anomaly detector flags high-risk contract items by comparing against predefined templates.";

  try {
    const results = await analyzePatentNovelty(testTitle, testAbstract, testDescription);
    console.log("\n=================== TEST RESULTS ===================");
    console.log(`Novelty Score: ${results.noveltyScore}%`);
    console.log(`Similarity Percentage: ${results.similarityPercentage}%`);
    console.log(`Closest Patent: ${results.closestPatent.title} (${results.closestPatent.patent_number})`);
    console.log("Top matches similarity breakdown:");
    results.topMatches.forEach(m => {
      console.log(` - ${m.patent_number} [${m.category}] - ${m.title}: ${m.similarities.overall}%`);
    });
    console.log("\n--- AI SUMMARY ---");
    console.log(results.aiSummary);
    console.log("=================== END TEST ===================");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Introduce delay to let SQLite connection open cleanly
setTimeout(test, 500);
