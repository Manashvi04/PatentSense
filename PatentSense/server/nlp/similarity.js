const { all } = require('../db/database');
const { TFIDF, tokenize } = require('./tfidf');

/**
 * Analyzes the similarity of a submitted patent against the database of existing patents.
 * Computes cosine similarity of Title, Abstract, and Description separately, then merges them.
 */
async function analyzePatentNovelty(title, abstract, description) {
  // 1. Fetch all patents from the database
  const dbPatents = await all("SELECT * FROM patents");
  if (dbPatents.length === 0) {
    throw new Error("No reference patents found in database. Please run the seed script.");
  }

  // 2. Initialize TF-IDF instances for each text section
  const titleModel = new TFIDF();
  const abstractModel = new TFIDF();
  const descriptionModel = new TFIDF();

  // Add the user submission as part of the corpus to train vocabulary
  titleModel.addDocument(title, 'query');
  abstractModel.addDocument(abstract, 'query');
  descriptionModel.addDocument(description, 'query');

  // Add reference database patents
  dbPatents.forEach(p => {
    titleModel.addDocument(p.title, p.id);
    abstractModel.addDocument(p.abstract, p.id);
    descriptionModel.addDocument(p.description, p.id);
  });

  // Calculate IDF matrices
  titleModel.calculateIDF();
  abstractModel.calculateIDF();
  descriptionModel.calculateIDF();

  // Get TF-IDF vectors for the query submission
  const queryTitleVec = titleModel.getVector(title);
  const queryAbstractVec = abstractModel.getVector(abstract);
  const queryDescriptionVec = descriptionModel.getVector(description);

  const results = [];

  // 3. Match against each database patent
  dbPatents.forEach(p => {
    const pTitleVec = titleModel.getVector(p.title);
    const pAbstractVec = abstractModel.getVector(p.abstract);
    const pDescriptionVec = descriptionModel.getVector(p.description);

    const titleSim = TFIDF.cosineSimilarity(queryTitleVec, pTitleVec);
    const abstractSim = TFIDF.cosineSimilarity(queryAbstractVec, pAbstractVec);
    const descSim = TFIDF.cosineSimilarity(queryDescriptionVec, pDescriptionVec);

    // Compute weighted similarity (Title: 20%, Abstract: 40%, Description: 40%)
    const overallSim = (titleSim * 0.20) + (abstractSim * 0.40) + (descSim * 0.40);

    // Find term overlap in abstract and description
    const userTokens = new Set(tokenize(abstract + " " + description));
    const patentTokens = new Set(tokenize(p.abstract + " " + p.description));
    const overlapTerms = [...userTokens].filter(t => patentTokens.has(t)).slice(0, 5);

    results.push({
      patent: p,
      similarities: {
        title: Math.round(titleSim * 100),
        abstract: Math.round(abstractSim * 100),
        description: Math.round(descSim * 100),
        overall: Math.round(overallSim * 100)
      },
      overlapTerms
    });
  });

  // Sort by overall similarity in descending order
  results.sort((a, b) => b.similarities.overall - a.similarities.overall);

  const closest = results[0];
  const maxSimilarity = closest.similarities.overall;
  
  // Novelty score is the inverse of the highest similarity score
  const noveltyScore = Math.max(0, Math.min(100, 100 - maxSimilarity));

  // Determine qualitative novelty rating
  let rating = "HIGH";
  if (noveltyScore < 45) rating = "LOW";
  else if (noveltyScore < 75) rating = "MEDIUM";

  // 4. Generate AI Analysis Summary
  const queryKeywords = titleModel.getKeywords(abstract + " " + description, 5);
  const closestKeywords = titleModel.getKeywords(closest.patent.abstract + " " + closest.patent.description, 5);
  const uniqueQueryKeywords = queryKeywords.filter(k => !closestKeywords.includes(k));

  let aiSummary = `### Executive Summary
The submitted invention details a development focusing on **${queryKeywords.slice(0, 3).join(', ')}**. 
A semantic scan of the patent corpus reveals a similarity match of **${maxSimilarity}%** with **${closest.patent.title}** (${closest.patent.patent_number}), categorized under *${closest.patent.category}*.

### Shared Core Concepts
The analysis identified a significant semantic overlap in the following areas:
${closest.overlapTerms.map(term => `- **${term}**: Both disclosures construct operations and architectures using this technological element.`).join('\n') || '- Minimal direct terminology overlap; similarities reside in high-level contextual phrasing.'}

### Distinctive Characteristics
To establish clear novelty and improve patentability:
- **Your Disclosure Unique Focus**: Emphasizes **${uniqueQueryKeywords.slice(0, 3).join(', ') || 'specialized system integration'}**.
- **Prior Art Focus**: Focused predominantly on **${closestKeywords.slice(0, 3).join(', ')}**.

### Patentability & Strategy
- **Novelty Rating**: **${rating}** (Novelty Score: **${noveltyScore}%**)
- **Filing Recommendation**: `;

  if (rating === "HIGH") {
    aiSummary += `The invention exhibits high novelty. The structural overlaps with existing patents are minimal. We recommend moving forward with drafting independent claims focusing on your unique implementation of **${uniqueQueryKeywords.slice(0, 2).join(' and ')}** to optimize filing speed.`;
  } else if (rating === "MEDIUM") {
    aiSummary += `The invention has moderate novelty. There are overlapping technical methodologies with the prior art, particularly regarding the use of **${closest.overlapTerms.slice(0, 2).join(' and ')}**. To prevent rejections under 35 U.S.C. 102/103, we recommend narrowing your claims to emphasize the specific novelty of your **${uniqueQueryKeywords.slice(0, 2).join(' or ')}** components.`;
  } else {
    aiSummary += `Low novelty detected. The technical description substantially mimics the mechanisms of the cited prior art (${closest.patent.patent_number}). Filing in its current form carries a high risk of rejection. We strongly recommend restructuring the core architecture or focus, specifically differentiating how your method handles **${uniqueQueryKeywords.slice(0, 2).join(' / ') || 'its processes'}** compared to the prior art's handling of **${closestKeywords.slice(0, 2).join(' and ')}**.`;
  }

  return {
    noveltyScore,
    similarityPercentage: maxSimilarity,
    aiSummary,
    closestPatent: closest.patent,
    topMatches: results.slice(0, 4).map(r => ({
      id: r.patent.id,
      patent_number: r.patent.patent_number,
      title: r.patent.title,
      category: r.patent.category,
      inventors: r.patent.inventors,
      assignee: r.patent.assignee,
      filing_date: r.patent.filing_date,
      abstract: r.patent.abstract,
      similarities: r.similarities,
      overlapTerms: r.overlapTerms
    }))
  };
}

module.exports = {
  analyzePatentNovelty
};
