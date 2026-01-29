import requests
import sys
import json
from datetime import datetime
import uuid

class EVChargingCMSAPITester:
    def __init__(self):
        self.base_url = "https://cms-auth-starter.preview.emergentagent.com/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.reset_token = None

    def log_test(self, name, success, message=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {message}")

    def test_api_connection(self):
        """Test basic API connectivity"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            success = response.status_code == 200
            expected_message = "EV Charging CMS API"
            if success and expected_message in response.json().get("message", ""):
                self.log_test("API Connection", True)
                return True
            else:
                self.log_test("API Connection", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("API Connection", False, str(e))
            return False

    def test_login_default_admin(self):
        """Test login with default admin credentials"""
        try:
            data = {
                "email": "admin@cms.com",
                "password": "admin123"
            }
            response = requests.post(f"{self.base_url}/auth/login", json=data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                self.token = result.get('access_token')
                user_data = result.get('user', {})
                self.user_id = user_data.get('id')
                
                # Validate response structure
                if (self.token and user_data.get('email') == 'admin@cms.com' 
                    and user_data.get('role') == 'SUPER_ADMIN'):
                    self.log_test("Login with Default Admin", True)
                    return True
                else:
                    self.log_test("Login with Default Admin", False, "Invalid response structure")
                    return False
            else:
                self.log_test("Login with Default Admin", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Login with Default Admin", False, str(e))
            return False

    def test_get_current_user(self):
        """Test getting current user info with token"""
        if not self.token:
            self.log_test("Get Current User", False, "No token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(f"{self.base_url}/auth/me", headers=headers, timeout=10)
            
            if response.status_code == 200:
                user_data = response.json()
                if (user_data.get('email') == 'admin@cms.com' and 
                    user_data.get('role') == 'SUPER_ADMIN'):
                    self.log_test("Get Current User", True)
                    return True
                else:
                    self.log_test("Get Current User", False, "Invalid user data")
                    return False
            else:
                self.log_test("Get Current User", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Get Current User", False, str(e))
            return False

    def test_register_new_user(self):
        """Test user registration"""
        try:
            test_email = f"test_user_{datetime.now().strftime('%H%M%S')}@test.com"
            data = {
                "email": test_email,
                "password": "TestPass123!",
                "full_name": "Test User",
                "role": "OPERATOR"
            }
            response = requests.post(f"{self.base_url}/auth/register", json=data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if (result.get('access_token') and 
                    result.get('user', {}).get('email') == test_email):
                    self.log_test("User Registration", True)
                    return True
                else:
                    self.log_test("User Registration", False, "Invalid response structure")
                    return False
            else:
                self.log_test("User Registration", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("User Registration", False, str(e))
            return False

    def test_duplicate_registration(self):
        """Test registration with existing email"""
        try:
            data = {
                "email": "admin@cms.com",  # Existing admin email
                "password": "TestPass123!",
                "full_name": "Duplicate User",
                "role": "OPERATOR"
            }
            response = requests.post(f"{self.base_url}/auth/register", json=data, timeout=10)
            
            if response.status_code == 400:
                self.log_test("Duplicate Registration Check", True)
                return True
            else:
                self.log_test("Duplicate Registration Check", False, f"Expected 400, got {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Duplicate Registration Check", False, str(e))
            return False

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        try:
            data = {
                "email": "admin@cms.com",
                "password": "wrongpassword"
            }
            response = requests.post(f"{self.base_url}/auth/login", json=data, timeout=10)
            
            if response.status_code == 401:
                self.log_test("Invalid Login Check", True)
                return True
            else:
                self.log_test("Invalid Login Check", False, f"Expected 401, got {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Invalid Login Check", False, str(e))
            return False

    def test_forgot_password(self):
        """Test forgot password functionality"""
        try:
            data = {"email": "admin@cms.com"}
            response = requests.post(f"{self.base_url}/auth/forgot-password", json=data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                self.reset_token = result.get('reset_token')  # For testing only
                if result.get('message') and self.reset_token:
                    self.log_test("Forgot Password", True)
                    return True
                else:
                    self.log_test("Forgot Password", False, "Missing expected fields in response")
                    return False
            else:
                self.log_test("Forgot Password", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Forgot Password", False, str(e))
            return False

    def test_reset_password(self):
        """Test password reset functionality"""
        if not self.reset_token:
            self.log_test("Reset Password", False, "No reset token available")
            return False
            
        try:
            data = {
                "token": self.reset_token,
                "new_password": "NewTestPass123!"
            }
            response = requests.post(f"{self.base_url}/auth/reset-password", json=data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if "Password reset successful" in result.get('message', ''):
                    self.log_test("Reset Password", True)
                    return True
                else:
                    self.log_test("Reset Password", False, "Unexpected response message")
                    return False
            else:
                self.log_test("Reset Password", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Reset Password", False, str(e))
            return False

    def test_login_after_reset(self):
        """Test login with new password after reset"""
        try:
            data = {
                "email": "admin@cms.com",
                "password": "NewTestPass123!"
            }
            response = requests.post(f"{self.base_url}/auth/login", json=data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('access_token'):
                    self.log_test("Login After Password Reset", True)
                    return True
                else:
                    self.log_test("Login After Password Reset", False, "No access token received")
                    return False
            else:
                self.log_test("Login After Password Reset", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Login After Password Reset", False, str(e))
            return False

    def test_unauthorized_access(self):
        """Test accessing protected endpoint without token"""
        try:
            response = requests.get(f"{self.base_url}/auth/me", timeout=10)
            
            if response.status_code == 403:  # FastAPI HTTPBearer returns 403 for missing auth
                self.log_test("Unauthorized Access Protection", True)
                return True
            else:
                self.log_test("Unauthorized Access Protection", False, f"Expected 403, got {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Unauthorized Access Protection", False, str(e))
            return False

    def test_invalid_token_access(self):
        """Test accessing protected endpoint with invalid token"""
        try:
            headers = {"Authorization": "Bearer invalid_token_here"}
            response = requests.get(f"{self.base_url}/auth/me", headers=headers, timeout=10)
            
            if response.status_code == 401:
                self.log_test("Invalid Token Protection", True)
                return True
            else:
                self.log_test("Invalid Token Protection", False, f"Expected 401, got {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Invalid Token Protection", False, str(e))
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting EV Charging CMS API Tests\n")
        print("=" * 50)
        
        # Test sequence
        tests = [
            ("API Connection", self.test_api_connection),
            ("Login Default Admin", self.test_login_default_admin),
            ("Get Current User", self.test_get_current_user),
            ("User Registration", self.test_register_new_user),
            ("Duplicate Registration Check", self.test_duplicate_registration),
            ("Invalid Login Check", self.test_invalid_login),
            ("Forgot Password", self.test_forgot_password),
            ("Reset Password", self.test_reset_password),
            ("Login After Reset", self.test_login_after_reset),
            ("Unauthorized Access", self.test_unauthorized_access),
            ("Invalid Token Access", self.test_invalid_token_access),
        ]
        
        for test_name, test_func in tests:
            print()
            test_func()
            
        print("\n" + "=" * 50)
        print(f"📊 FINAL RESULTS: {self.tests_passed}/{self.tests_run} tests passed")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"🎯 Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed!")
            return False

def main():
    tester = EVChargingCMSAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())