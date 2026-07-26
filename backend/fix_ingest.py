import os

file_path = "app/services/ingest.py"
with open(file_path, "r") as f:
    lines = f.readlines()

out = []
in_sq = False
in_sk = False

for line in lines:
    if "from langchain_google_genai import ChatGoogleGenerativeAI" in line:
        continue # remove import
        
    if "def generate_suggested_questions" in line:
        in_sq = True
        out.append(line)
        out.append('    """Generate 3 dynamic suggested questions based on document content."""\n')
        out.append('    try:\n')
        out.append('        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={settings.GOOGLE_API_KEY}"\n')
        out.append('        prompt = f"""\n')
        out.append('        Based on the following supply chain document excerpt, generate 3 specific, useful questions that a user might ask about it.\n')
        out.append('        Return ONLY a valid JSON array of 3 strings. Do not include any other formatting, markdown, or text.\n')
        out.append('        \n')
        out.append('        Excerpt:\n')
        out.append('        {text_snippet}\n')
        out.append('        """\n')
        out.append('        payload = {"contents": [{"parts": [{"text": prompt}]}]}\n')
        out.append('        resp = requests.post(url, json=payload)\n')
        out.append('        if resp.status_code == 200:\n')
        out.append('            data = resp.json()\n')
        out.append('            text = data["candidates"][0]["content"]["parts"][0]["text"].strip()\n')
        out.append('            if text.startswith("```json"):\n')
        out.append('                text = text[7:-3].strip()\n')
        out.append('            elif text.startswith("```"):\n')
        out.append('                text = text[3:-3].strip()\n')
        out.append('            questions = json.loads(text)\n')
        out.append('            if isinstance(questions, list):\n')
        out.append('                return json.dumps(questions[:3])\n')
        out.append('    except Exception as e:\n')
        out.append('        logger.error(f"Failed to generate suggested questions: {str(e)}", exc_info=True)\n')
        out.append('    return json.dumps(["What are the key terms in this document?", "Who are the parties involved?", "What are the deadlines?"])\n')
        continue
        
    if "def generate_summary_and_keywords" in line:
        in_sq = False
        in_sk = True
        out.append(line)
        out.append('    """Generate a summary and keywords for the document."""\n')
        out.append('    try:\n')
        out.append('        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={settings.GOOGLE_API_KEY}"\n')
        out.append('        prompt = f"""\n')
        out.append('        Based on the following supply chain document excerpt, generate:\n')
        out.append('        1. A brief summary (2-3 sentences) of the document\'s purpose.\n')
        out.append('        2. A list of 4-6 key entities, terms, or risk factors as keywords.\n')
        out.append('        \n')
        out.append('        Return ONLY a valid JSON object with the keys "summary" (string) and "keywords" (array of strings). Do not include any other formatting or markdown.\n')
        out.append('        \n')
        out.append('        Excerpt:\n')
        out.append('        {text_snippet}\n')
        out.append('        """\n')
        out.append('        payload = {"contents": [{"parts": [{"text": prompt}]}]}\n')
        out.append('        resp = requests.post(url, json=payload)\n')
        out.append('        if resp.status_code == 200:\n')
        out.append('            data = resp.json()\n')
        out.append('            text = data["candidates"][0]["content"]["parts"][0]["text"].strip()\n')
        out.append('            if text.startswith("```json"):\n')
        out.append('                text = text[7:-3].strip()\n')
        out.append('            elif text.startswith("```"):\n')
        out.append('                text = text[3:-3].strip()\n')
        out.append('            parsed = json.loads(text)\n')
        out.append('            return {\n')
        out.append('                "summary": parsed.get("summary", "Document summary unavailable."),\n')
        out.append('                "keywords": parsed.get("keywords", [])\n')
        out.append('            }\n')
        out.append('    except Exception as e:\n')
        out.append('        logger.error(f"Failed to generate summary and keywords: {str(e)}", exc_info=True)\n')
        out.append('    return {"summary": "Document processed without summary.", "keywords": []}\n')
        continue
        
    if "def ingest_document_sync" in line:
        in_sk = False
        in_sq = False
        
    if not in_sq and not in_sk:
        out.append(line)

with open(file_path, "w") as f:
    f.writelines(out)
