from fastapi.testclient import TestClient
from app.main import app
import pytest

client = TestClient(app)

@pytest.fixture
def test_user():
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword"
    }

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the ManifestIQ API"}

def test_signup_and_login(test_user):
    signup_resp = client.post("/api/auth/signup", json=test_user)
    assert signup_resp.status_code in (200, 400, 429)
    
    login_resp = client.post("/api/auth/login", data={
        "identifier": test_user["email"],
        "password": test_user["password"]
    })
    
    if login_resp.status_code == 200:
        assert "access_token" in login_resp.json()
        assert login_resp.json()["token_type"] == "bearer"
    else:
        assert login_resp.status_code in (401, 429)
