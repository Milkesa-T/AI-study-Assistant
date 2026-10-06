"""Document parsing and text chunking service.

This module handles:
1. Extracting text from PDFs, Markdown, and TXT files.
2. Cleaning & normalizing extracted text.
3. Semantic chunking with sliding-window overlap to preserve context across chunk boundaries.
"""

import re
from pathlib import Path
from typing import List, Dict, Any
from pypdf import PdfReader


class DocumentParser:
    """Handles extracting, cleaning, and chunking text from various document formats."""

    @staticmethod
    def extract_text(file_path: str) -> str:
        """Extract text from a file based on its extension (.pdf, .txt, .md)."""
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found at: {file_path}")

        ext = path.suffix.lower()

        if ext == ".pdf":
            return DocumentParser._extract_from_pdf(path)
        elif ext in [".txt", ".md"]:
            return DocumentParser._extract_from_text(path)
        else:
            raise ValueError(f"Unsupported file format: '{ext}'. Supported formats: .pdf, .txt, .md")

    @staticmethod
    def _extract_from_pdf(file_path: Path) -> str:
        """Extract all textual content page-by-page from a PDF."""
        reader = PdfReader(str(file_path))
        extracted_pages: List[str] = []

        for page_num, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                # Add a marker so we know where page boundaries were
                extracted_pages.append(text)

        raw_text = "\n\n".join(extracted_pages)
        return DocumentParser.clean_text(raw_text)

    @staticmethod
    def _extract_from_text(file_path: Path) -> str:
        """Read text or markdown files with UTF-8 fallback."""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
        except UnicodeDecodeError:
            with open(file_path, "r", encoding="latin-1") as f:
                content = f.read()

        return DocumentParser.clean_text(content)

    @staticmethod
    def clean_text(text: str) -> str:
        """Normalize whitespace, remove carriage returns, and clean up unprintable chars."""
        if not text:
            return ""
        # Normalize CRLF to LF
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        # Replace multiple spaces/tabs with single space
        text = re.sub(r"[ \t]+", " ", text)
        # Replace 3 or more consecutive newlines with 2 newlines (preserve paragraphs)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    @staticmethod
    def chunk_text(
        text: str,
        chunk_size: int = 500,
        chunk_overlap: int = 100
    ) -> List[Dict[str, Any]]:
        """Split text into overlapping chunks using a recursive separator strategy.

        Why chunk with overlap?
        - AI Vector embedding models (and LLM context windows) perform best when
          information is focused in manageable pieces (e.g., 300-800 words/tokens).
        - Overlap ensures that a sentence or definition cut in half at a chunk boundary
          remains fully understandable in the next chunk.

        Returns:
            List of dicts: [{"chunk_index": 0, "text": "...", "char_count": 480}]
        """
        if not text:
            return []

        if chunk_overlap >= chunk_size:
            raise ValueError("chunk_overlap must be strictly less than chunk_size")

        # Step 1: Split text by paragraphs first, then sentences, then words
        paragraphs = text.split("\n\n")
        chunks: List[str] = []
        current_chunk: List[str] = []
        current_length = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            para_len = len(para)

            # If a single paragraph is larger than chunk_size, split by sentences
            if para_len > chunk_size:
                sentences = re.split(r"(?<=[.?!])\s+", para)
                for sentence in sentences:
                    sentence = sentence.strip()
                    if not sentence:
                        continue
                    sentence_len = len(sentence)

                    if current_length + sentence_len > chunk_size and current_chunk:
                        chunk_str = " ".join(current_chunk)
                        chunks.append(chunk_str)

                        # Create overlap by keeping the tail end
                        overlap_chars = 0
                        new_start = len(current_chunk)
                        for i in range(len(current_chunk) - 1, -1, -1):
                            overlap_chars += len(current_chunk[i]) + 1
                            if overlap_chars >= chunk_overlap:
                                new_start = i
                                break
                        current_chunk = current_chunk[new_start:]
                        current_length = sum(len(s) + 1 for s in current_chunk)

                    current_chunk.append(sentence)
                    current_length += sentence_len + 1
            else:
                if current_length + para_len > chunk_size and current_chunk:
                    chunk_str = "\n\n".join(current_chunk)
                    chunks.append(chunk_str)

                    # Reset with overlap
                    overlap_chars = 0
                    new_start = len(current_chunk)
                    for i in range(len(current_chunk) - 1, -1, -1):
                        overlap_chars += len(current_chunk[i]) + 2
                        if overlap_chars >= chunk_overlap:
                            new_start = i
                            break
                    current_chunk = current_chunk[new_start:]
                    current_length = sum(len(p) + 2 for p in current_chunk)

                current_chunk.append(para)
                current_length += para_len + 2

        # Add remaining text as last chunk
        if current_chunk:
            chunks.append("\n\n".join(current_chunk).strip())

        # Format with metadata
        return [
            {
                "chunk_index": idx,
                "text": chunk.strip(),
                "char_count": len(chunk.strip())
            }
            for idx, chunk in enumerate(chunks)
            if chunk.strip()
        ]
