#!/usr/bin/env python3
"""
Test script to verify AstroGuard setup
"""
import sys
import subprocess
import os

def test_backend():
    """Test backend setup"""
    print("Testing backend setup...")
    
    # Check if virtual environment exists
    if not os.path.exists("backend/venv"):
        print("❌ Backend virtual environment not found. Run setup first.")
        return False
    
    # Check if requirements are installed
    try:
        import flask
        import numpy
        import requests
        print("✅ Backend dependencies installed")
        return True
    except ImportError as e:
        print(f"❌ Backend dependency missing: {e}")
        return False

def test_frontend():
    """Test frontend setup"""
    print("Testing frontend setup...")
    
    # Check if node_modules exists
    if not os.path.exists("frontend/node_modules"):
        print("❌ Frontend dependencies not installed. Run setup first.")
        return False
    
    # Check if package.json exists
    if not os.path.exists("frontend/package.json"):
        print("❌ Frontend package.json not found")
        return False
    
    print("✅ Frontend setup looks good")
    return True

def main():
    """Run all tests"""
    print("🧪 Testing AstroGuard Setup")
    print("=" * 40)
    
    backend_ok = test_backend()
    frontend_ok = test_frontend()
    
    print("\n" + "=" * 40)
    if backend_ok and frontend_ok:
        print("🎉 Setup test passed! Ready to run AstroGuard")
        print("\nTo start the application:")
        print("1. Backend: cd backend && venv\\Scripts\\activate && python app.py")
        print("2. Frontend: cd frontend && npm run dev")
    else:
        print("❌ Setup test failed. Please run setup.bat or setup.sh first")
        sys.exit(1)

if __name__ == "__main__":
    main()


