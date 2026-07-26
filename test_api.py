import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("--- Testing Remaining Features ---")
    
    # 1. Register User
    username = f"testuser_{int(time.time())}"
    res = requests.post(f"{BASE_URL}/api/auth/signup", json={
        "username": username,
        "email": f"{username}@example.com",
        "password": "testpassword123"
    })
    
    # 2. Login User
    res = requests.post(f"{BASE_URL}/api/auth/login", data={
        "identifier": username,
        "password": "testpassword123"
    })
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Upload Document
    with open("dummy.pdf", "rb") as f:
        res = requests.post(
            f"{BASE_URL}/api/documents/upload", 
            headers=headers,
            files={"file": ("dummy.pdf", f, "application/pdf")}
        )
    doc_id = res.json()["document_id"]
    
    print("Waiting for ingestion (5s)...")
    time.sleep(5)
    
    # 4. Semantic Search
    print("\n--- Testing Semantic Search ---")
    res = requests.post(
        f"{BASE_URL}/api/documents/search", 
        headers=headers,
        json={"query": "test document", "document_ids": [doc_id]}
    )
    print(res.status_code)
    try:
        print(res.json())
    except:
        print(res.text)

    # 5. Query / Chat (SSE)
    print("\n--- Testing Query (SSE Stream) ---")
    res = requests.post(
        f"{BASE_URL}/api/query/ask",
        headers=headers,
        json={
            "document_ids": [doc_id],
            "query": "What is this document about?",
            "chat_history": []
        },
        stream=True
    )
    
    print(res.status_code)
    log_id = None
    if res.status_code == 200:
        for line in res.iter_lines():
            if line:
                decoded = line.decode('utf-8')
                print(decoded)
                try:
                    data = json.loads(decoded)
                    if data.get("type") == "complete":
                        log_id = data.get("log_id")
                except:
                    pass
    else:
        print(res.text)

    # 6. Feedback
    if log_id:
        print(f"\n--- Testing Feedback for Log ID {log_id} ---")
        res = requests.post(
            f"{BASE_URL}/api/query/{log_id}/feedback",
            headers=headers,
            json={"feedback": 1}
        )
        print(res.status_code, res.text)
    
    # 7. Analytics Dashboard
    print("\n--- Testing Analytics Dashboard ---")
    res = requests.get(
        f"{BASE_URL}/api/analytics/dashboard",
        headers=headers
    )
    print(res.status_code, res.text)

if __name__ == "__main__":
    run_tests()
