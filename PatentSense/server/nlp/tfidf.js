// TF-IDF implementation in pure JavaScript

const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'cant', 'cannot', 'could',
  'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'hadnt', 'has', 'hasnt', 'have', 'havent', 'having', 'he', 'hed', 'hell', 'hes', 'her', 'here',
  'heres', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'hows', 'i', 'id', 'ill', 'im', 'ive', 'if', 'in',
  'into', 'is', 'isnt', 'it', 'its', 'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor',
  'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such', 'than', 'that',
  'thats', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these', 'they', 'theyd',
  'theyll', 'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was',
  'wasnt', 'we', 'wed', 'well', 'were', 'weve', 'werent', 'what', 'whats', 'when', 'whens', 'where', 'wheres',
  'which', 'while', 'who', 'whos', 'whom', 'why', 'whys', 'with', 'wont', 'would', 'wouldnt', 'you', 'youd',
  'youll', 'youre', 'youve', 'your', 'yours', 'yourself', 'yourselves',
  // Domain specific stopwords to prevent generic match inflation
  'patent', 'invention', 'method', 'system', 'device', 'apparatus', 'herein', 'preferred', 'embodiment', 'according',
  'present', 'claims', 'disclosed', 'disclosure', 'description', 'thereof', 'user', 'data', 'information', 'process',
  'therein', 'whereby', 'thereby', 'hereby', 'claim', 'embodiments', 'comprises', 'comprising', 'plurality', 'aspect'
]);

function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s_]+/)
    .map(word => word.trim())
    .filter(word => word.length > 2 && !STOPWORDS.has(word));
}

class TFIDF {
  constructor() {
    this.documents = []; // Array of documents: { id, termFreqs: Map, totalTerms: number }
    this.docCount = 0;
    this.termDocCount = {}; // Frequency of term in the document corpus (df)
    this.idf = {}; // Term to IDF mapping
    this.isTrained = false;
  }

  addDocument(text, id) {
    const tokens = tokenize(text);
    if (tokens.length === 0) return;

    const termFreqs = new Map();
    tokens.forEach(token => {
      termFreqs.set(token, (termFreqs.get(token) || 0) + 1);
    });

    this.documents.push({ id, termFreqs, totalTerms: tokens.length });
    this.docCount++;

    for (const term of termFreqs.keys()) {
      this.termDocCount[term] = (this.termDocCount[term] || 0) + 1;
    }
    
    this.isTrained = false;
  }

  calculateIDF() {
    this.idf = {};
    for (const term in this.termDocCount) {
      const df = this.termDocCount[term];
      // Standard IDF smoothing
      this.idf[term] = Math.log(this.docCount / df) + 1;
    }
    this.isTrained = true;
  }

  getVector(text) {
    if (!this.isTrained) {
      this.calculateIDF();
    }

    const tokens = tokenize(text);
    const tf = new Map();
    tokens.forEach(token => {
      tf.set(token, (tf.get(token) || 0) + 1);
    });

    const vector = {};
    for (const [term, freq] of tf.entries()) {
      // Sublinear term frequency scaling: 1 + log(tf)
      const tfScore = 1 + Math.log(freq);
      const idfScore = this.idf[term] || 0;
      if (idfScore > 0) {
        vector[term] = tfScore * idfScore;
      }
    }
    return vector;
  }

  static cosineSimilarity(vecA, vecB) {
    const termsA = Object.keys(vecA);
    const termsB = Object.keys(vecB);
    
    if (termsA.length === 0 || termsB.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    const setB = new Set(termsB);

    for (const term of termsA) {
      const valA = vecA[term];
      normA += valA * valA;
      if (setB.has(term)) {
        dotProduct += valA * vecB[term];
      }
    }

    for (const term of termsB) {
      const valB = vecB[term];
      normB += valB * valB;
    }

    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  getKeywords(text, count = 5) {
    const vec = this.getVector(text);
    return Object.entries(vec)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(entry => entry[0]);
  }
}

module.exports = {
  tokenize,
  TFIDF
};
