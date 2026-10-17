import hashlib
import io
import json
import os
import re
import zipfile
import xml.etree.ElementTree as ET
from threading import Lock
from urllib.parse import unquote

import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS

# Read the same optional project .env file used by Express.
env_file = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.isfile(env_file):
    with open(env_file, encoding="utf-8") as settings:
        for line in settings:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                os.environ.setdefault(key.strip(), value.strip().strip("\"'"))

try:
    import faiss
except Exception:
    faiss = None

try:
    from sentence_transformers import SentenceTransformer

    model = SentenceTransformer(os.environ.get("SENTENCE_TRANSFORMER_MODEL", "all-MiniLM-L6-v2"))
    MODEL_LOADED = True
    print("AI Service: Sentence Transformer model loaded.")
except Exception as error:
    model = None
    MODEL_LOADED = False
    print(f"AI Service: transformer unavailable ({error}); using local lexical fallback.")

if MODEL_LOADED:
    RETRIEVAL_METHOD = "sentence-transformers+faiss" if faiss else "sentence-transformers+numpy"
else:
    RETRIEVAL_METHOD = "hashed-lexical+faiss" if faiss else "hashed-lexical+numpy"
try:
    MIN_SIMILARITY = max(0.0, min(1.0, float(os.environ.get("MIN_SIMILARITY", "0.25"))))
except ValueError:
    MIN_SIMILARITY = 0.25

app = Flask(__name__)
CORS(app)
MAX_UPLOAD_BYTES = 25 * 1024 * 1024
MAX_EXTRACTED_CHARS = 500_000
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES
INDEX_LOCK = Lock()
FAISS_CACHE = {"key": None, "index": None, "embeddings": None, "candidates": None}


def parse_document_sections(text):
    sections = {"abstract": [], "claims": [], "description": []}
    current = None
    heading_patterns = (
        ("abstract", re.compile(r"^abstract(?:\s+of\s+(?:the\s+)?(?:invention|disclosure))?\s*:?(?:\s+(.*))?$", re.I)),
        ("claims", re.compile(r"^claims?\s*:?(?:\s+(.*))?$", re.I)),
        ("description", re.compile(r"^(?:detailed\s+description|description(?:\s+of\s+(?:the\s+)?invention)?)\s*:?(?:\s+(.*))?$", re.I)),
    )
    for line in text.splitlines():
        cleaned = line.strip()
        if not cleaned:
            if current and sections[current] and sections[current][-1] != "":
                sections[current].append("")
            continue
        matched = next(((name, pattern.fullmatch(cleaned)) for name, pattern in heading_patterns if pattern.fullmatch(cleaned)), None)
        if matched:
            current, heading = matched
            if heading.group(1):
                sections[current].append(heading.group(1).strip())
        elif current:
            sections[current].append(cleaned)
    return {name: "\n".join(lines).strip() for name, lines in sections.items()}


def extract_document(filename, content):
    extension = os.path.splitext(filename)[1].lower()
    if extension not in {".pdf", ".docx", ".txt"}:
        raise ValueError("Unsupported file type. Upload a PDF, DOCX, or TXT file.")
    if not content:
        raise ValueError("The uploaded file is empty.")

    if extension == ".txt":
        if content.startswith((b"\xff\xfe", b"\xfe\xff")):
            text = content.decode("utf-16")
        else:
            text = content.decode("utf-8-sig")
        if "\x00" in text:
            raise ValueError("The TXT file contains binary data and could not be read as text.")
    elif extension == ".pdf":
        if not content.startswith(b"%PDF-"):
            raise ValueError("The file extension is PDF, but its contents are not a valid PDF.")
        from PyPDF2 import PdfReader

        reader = PdfReader(io.BytesIO(content), strict=False)
        if reader.is_encrypted:
            raise ValueError("Password-protected PDFs are not supported.")
        if len(reader.pages) > 2000:
            raise ValueError("The PDF exceeds the 2,000 page limit.")
        text = "\n\n".join(page.extract_text() or "" for page in reader.pages)
    else:
        if not content.startswith(b"PK"):
            raise ValueError("The file extension is DOCX, but its contents are not a valid DOCX document.")
        try:
            with zipfile.ZipFile(io.BytesIO(content)) as document:
                infos = document.infolist()
                if sum(info.file_size for info in infos) > 80 * 1024 * 1024:
                    raise ValueError("The DOCX expands beyond the permitted extraction size.")
                xml = document.read("word/document.xml")
            root = ET.fromstring(xml)
            word_ns = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
            paragraphs = []
            for paragraph in root.iter(f"{word_ns}p"):
                words = [node.text or "" for node in paragraph.iter(f"{word_ns}t")]
                paragraphs.append("".join(words))
            text = "\n".join(paragraphs)
        except (KeyError, zipfile.BadZipFile, ET.ParseError) as error:
            raise ValueError("The DOCX document is invalid or cannot be read.") from error

    text = "\n".join(line.rstrip() for line in text.replace("\x00", "").splitlines()).strip()
    if not text:
        raise ValueError("No readable text was found. Scanned PDFs need OCR before they can be analyzed.")
    if len(text) > MAX_EXTRACTED_CHARS:
        raise ValueError(f"Extracted text exceeds the {MAX_EXTRACTED_CHARS:,} character limit.")
    return text


def encode_texts(texts):
    """Return unit vectors from Sentence-BERT, or a deterministic local fallback."""
    if model is not None:
        vectors = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
        vectors = np.asarray(vectors, dtype=np.float32)
    else:
        vectors = np.zeros((len(texts), 384), dtype=np.float32)
        for row, text in enumerate(texts):
            tokens = re.findall(r"[a-z0-9]+", text.lower())
            for token in tokens:
                digest = hashlib.blake2b(token.encode("utf-8"), digest_size=8).digest()
                index = int.from_bytes(digest[:4], "little") % vectors.shape[1]
                vectors[row, index] += 1.0 if digest[4] & 1 else -1.0
            norm = np.linalg.norm(vectors[row])
            if norm:
                vectors[row] /= norm
    if vectors.ndim != 2 or not np.isfinite(vectors).all():
        raise ValueError("Embedding model returned invalid vectors")
    return vectors


def candidate_text(candidate):
    return " ".join(str(candidate.get(field) or "") for field in ("title", "abstract", "description")).strip()


def build_index(candidates):
    embeddings = encode_texts([candidate_text(candidate) for candidate in candidates])
    if not embeddings.shape[0]:
        return None, embeddings
    if faiss is None:
        return None, embeddings
    index = faiss.IndexFlatIP(embeddings.shape[1])
    index.add(np.ascontiguousarray(embeddings, dtype=np.float32))
    return index, embeddings


def cached_candidate_index(candidates):
    key = hashlib.sha256(json.dumps(candidates, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()
    with INDEX_LOCK:
        if FAISS_CACHE["key"] != key:
            index, embeddings = build_index(candidates)
            FAISS_CACHE.update(key=key, index=index, embeddings=embeddings, candidates=candidates)
        return FAISS_CACHE["index"], FAISS_CACHE["embeddings"], FAISS_CACHE["candidates"]


def cosine_percent(left, right):
    if not np.any(left) or not np.any(right):
        return 0
    cosine = float(np.dot(left, right) / (np.linalg.norm(left) * np.linalg.norm(right)))
    if not np.isfinite(cosine):
        return 0
    return round(max(0.0, min(1.0, cosine)) * 100)


@app.get("/health")
def health():
    return jsonify({
        "status": "healthy",
        "model_loaded": MODEL_LOADED,
        "model_name": os.environ.get("SENTENCE_TRANSFORMER_MODEL", "all-MiniLM-L6-v2") if MODEL_LOADED else "hashed-lexical-fallback",
        "faiss_loaded": faiss is not None,
        "retrieval_method": RETRIEVAL_METHOD,
        "minimum_similarity": MIN_SIMILARITY,
    })


@app.errorhandler(413)
def upload_too_large(_error):
    return jsonify({"code": "UPLOAD_TOO_LARGE", "error": "Upload exceeds the 25 MB file size limit."}), 413


@app.post("/api/extract")
def extract_upload():
    filename = os.path.basename(unquote(request.headers.get("X-Filename", ""))).strip()
    content = request.get_data(cache=False)
    if not filename:
        return jsonify({"code": "FILENAME_REQUIRED", "error": "Upload filename is required."}), 400
    if os.path.splitext(filename)[1].lower() not in {".pdf", ".docx", ".txt"}:
        return jsonify({"code": "UNSUPPORTED_FILE_TYPE", "error": "Upload a PDF, DOCX, or TXT file."}), 415
    if len(content) > MAX_UPLOAD_BYTES:
        return jsonify({"code": "UPLOAD_TOO_LARGE", "error": "Upload exceeds the 25 MB file size limit."}), 413
    try:
        text = extract_document(filename, content)
    except ValueError as error:
        return jsonify({"code": "DOCUMENT_EXTRACTION_FAILED", "error": str(error)}), 422
    except Exception:
        app.logger.exception("Document extraction failed")
        return jsonify({"code": "DOCUMENT_EXTRACTION_FAILED", "error": "This document could not be read. Check that it is a valid, unprotected file."}), 422

    return jsonify({
        "filename": filename,
        "fileType": os.path.splitext(filename)[1][1:].upper(),
        "text": text,
        "sections": parse_document_sections(text),
        "characters": len(text),
    })


@app.post("/api/similarity")
def similarity():
    data = request.get_json(silent=True) or {}
    query = data.get("query") or {}
    candidates = data.get("candidates") or []
    if not isinstance(query, dict) or not isinstance(candidates, list):
        return jsonify({"error": "Query must be an object and candidates must be an array."}), 400
    query_text = str(query.get("sourceText") or "").strip() or " ".join(
        str(query.get(field) or "") for field in ("title", "abstract", "claims", "description")
    ).strip()
    candidates = [candidate for candidate in candidates if isinstance(candidate, dict) and candidate.get("id") is not None and candidate_text(candidate)]
    if not query_text:
        return jsonify({"error": "Query must include non-empty title, abstract, or description text."}), 400
    if not candidates:
        return jsonify({
            "results": [], "no_suitable_match": True,
            "retrieval_method": RETRIEVAL_METHOD, "minimum_similarity": MIN_SIMILARITY,
        }), 200

    try:
        index, embeddings, candidates = cached_candidate_index(candidates)
        query_embedding = encode_texts([query_text])[0]
        limit = min(5, len(candidates))
        if index is not None:
            scores, indices = index.search(query_embedding.reshape(1, -1), limit)
            ranked = [(float(score), int(candidate_index)) for score, candidate_index in zip(scores[0], indices[0]) if candidate_index >= 0]
        else:
            ranked = [(float(score), candidate_index) for candidate_index, score in enumerate(embeddings @ query_embedding)]
            ranked.sort(key=lambda item: item[0], reverse=True)

        field_queries = {}
        field_embeddings = {}
        for field in ("title", "abstract", "description"):
            field_text = str(query.get(field) or "").strip()
            field_queries[field] = encode_texts([field_text])[0] if field_text else None
            if field_text:
                field_embeddings[field] = encode_texts([str(candidate.get(field) or "") for candidate in candidates])

        results = []
        for raw_score, candidate_index in ranked:
            candidate = candidates[candidate_index]
            score = max(0.0, min(1.0, raw_score)) if np.isfinite(raw_score) else 0.0
            if score < MIN_SIMILARITY:
                continue
            result = {
                "id": candidate["id"],
                "patent_number": candidate.get("patent_number"),
                "title": candidate.get("title"),
                "abstract": candidate.get("abstract"),
                "description": candidate.get("description"),
                "category": candidate.get("category"),
                "filing_date": candidate.get("filing_date"),
                "similarities": {
                    "title": cosine_percent(field_queries["title"], field_embeddings["title"][candidate_index]) if field_queries["title"] is not None else 0,
                    "abstract": cosine_percent(field_queries["abstract"], field_embeddings["abstract"][candidate_index]) if field_queries["abstract"] is not None else 0,
                    "description": cosine_percent(field_queries["description"], field_embeddings["description"][candidate_index]) if field_queries["description"] is not None else 0,
                    "overall": round(score * 100),
                },
            }
            results.append(result)
            if len(results) == limit:
                break

        return jsonify({
            "results": results,
            "no_suitable_match": not results,
            "retrieval_method": RETRIEVAL_METHOD,
            "minimum_similarity": MIN_SIMILARITY,
        })
    except Exception as error:
        app.logger.exception("Similarity request failed")
        return jsonify({"error": "Similarity retrieval failed."}), 500


if __name__ == "__main__":
    port = int(os.environ.get("AI_PORT", "5001"))
    app.run(host=os.environ.get("HOST", "127.0.0.1"), port=port, debug=False)
