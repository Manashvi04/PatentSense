import faiss
import numpy as np

# Helper to build FAISS index from candidate documents
def build_faiss_index(candidates):
    # Generate embeddings for each candidate (concatenate title, abstract, description)
    texts = [f"{c.get('title','')} {c.get('abstract','')} {c.get('description','')}" for c in candidates]
    if not texts:
        return None, None
    embeddings = model.encode(texts, convert_to_numpy=True)
    d = embeddings.shape[1]
    index = faiss.IndexFlatL2(d)
    index.add(embeddings)
    return index, embeddings

# Cache to avoid rebuilding on every request (simple in‑memory cache)
FAISS_CACHE = {
    'candidates_hash': None,
    'index': None,
    'embeddings': None,
    'candidates': None
}


# Load Hugging Face Sentence Transformers model dynamically if installed
try:
    from sentence_transformers import SentenceTransformer
    MODEL_LOADED = True
    model = SentenceTransformer('all-MiniLM-L6-v2')
    print("AI Service: Successfully loaded all-MiniLM-L6-v2 model.")
except Exception as e:
    MODEL_LOADED = False
    print(f"AI Service WARNING: Sentence Transformers load failed ({str(e)}). Running in fallback/simulation mode.")

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "model_loaded": MODEL_LOADED,
        "model_name": "all-MiniLM-L6-v2" if MODEL_LOADED else "simulation-fallback"
    })

def compute_cosine_similarity(vec1, vec2):
    dot_product = np.dot(vec1, vec2)
    norm_a = np.linalg.norm(vec1)
    norm_b = np.linalg.norm(vec2)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot_product / (norm_a * norm_b))

@app.route('/api/similarity', methods=['POST'])
def similarity():
    data = request.json
    if not data:
        return jsonify({"error": "Request body is empty"}), 400
        
    query = data.get('query', {})
    candidates = data.get('candidates', [])
    
    if not query or not candidates:
        return jsonify({"error": "Both 'query' document and 'candidates' array are required"}), 400

    q_title = query.get('title', '')
    q_abs = query.get('abstract', '')
    q_desc = query.get('description', '')

    try:
        results = []
        # Ensure FAISS index is up-to-date for the provided candidates
        candidates_hash = hash(tuple(sorted([c['id'] for c in candidates])))
        if FAISS_CACHE['candidates_hash'] != candidates_hash:
            index, embeddings = build_faiss_index(candidates)
            FAISS_CACHE.update({
                'candidates_hash': candidates_hash,
                'index': index,
                'embeddings': embeddings,
                'candidates': candidates
            })
        else:
            index = FAISS_CACHE['index']
            embeddings = FAISS_CACHE['embeddings']
            candidates = FAISS_CACHE['candidates']
        if not index:
            return jsonify({"error": "No candidates to index"}), 400
        # Compute query embedding (concatenated fields)
        q_text = f"{q_title} {q_abs} {q_desc}"
        q_emb = model.encode([q_text], convert_to_numpy=True)
        # Search top K matches (e.g., 5)
        k = min(5, len(candidates))
        distances, indices = index.search(q_emb, k)
        for dist, idx in zip(distances[0], indices[0]):
            cand = candidates[idx]
            cand_emb = embeddings[idx]
            sim = compute_cosine_similarity(q_emb[0], cand_emb)
            results.append({
                "id": cand.get('id'),
                "similarities": {
                    "title": 0,
                    "abstract": 0,
                    "description": 0,
                    "overall": round(sim * 100)
                }
            })
        return jsonify({"results": results})
    except Exception as e:
        print(f"AI Service Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)
